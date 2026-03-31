import type { ReactNode } from 'react'
import { StrictMode, Suspense, lazy } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { LoaderDataContext } from '../data/use-loader-data'
import { RouteHead } from '../head/client-head'
import { createNdjsonReader } from '../ndjson/reader'
import { RouterProvider, useRouterContext } from '../router/context'
import { normalizePath, pathToRegex } from '../router/route-matcher'
import type { HeadComponent, HtmlAttributes, RouteManifest } from '../types'
import { DefaultErrorFallback } from './default-error-fallback'

declare global {
  interface Window {
    __ROUTE_DATA__: Record<string, unknown>
    __ROUTE_MANIFEST__: RouteManifest
    __MATCHED_ROUTE__: { path: string; params: Record<string, string> }
    __ROUTE_ERROR__?: string
  }
}

export interface ClientRoute {
  /** Route path pattern, e.g., "/blog/:slug" */
  path: string
  /** Lazy-load the page module */
  load: () => Promise<{ default: React.ComponentType }>
  /** Route name for display */
  name: string
  /** Whether this route has a loader */
  hasLoader?: boolean
  /** Dynamic parameter names */
  paramNames?: string[]
  /** Layout components for this route (eagerly imported) */
  layouts?: React.ComponentType<{ children?: ReactNode }>[]
  /** Head component loaders for this route (one per head.tsx in the path) */
  headLoaders?: (() => Promise<{
    default?: HeadComponent
    head?: HeadComponent
  }>)[]
}

/** Pre-compiled pattern cache for client route matching */
const routePatternCache = new WeakMap<ClientRoute[], Map<string, RegExp>>()

function getRoutePatterns(routes: ClientRoute[]): Map<string, RegExp> {
  let cache = routePatternCache.get(routes)
  if (!cache) {
    cache = new Map()
    for (const r of routes) {
      cache.set(r.path, pathToRegex(r.path))
    }
    routePatternCache.set(routes, cache)
  }
  return cache
}

function matchClientRoute(
  pathname: string,
  routes: ClientRoute[],
): ClientRoute | undefined {
  const normalized = normalizePath(pathname)
  const patterns = getRoutePatterns(routes)
  return routes.find(r => patterns.get(r.path)!.test(normalized))
}

interface FetchRouteDataResult {
  loaderData: unknown
  params: Record<string, string>
  notFound?: boolean
  error?: string
  htmlAttributes?: HtmlAttributes
}

interface DeferredResolver {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
}

/**
 * Sync html attributes returned by getDocumentProps onto document.documentElement.
 * Removes stale attributes from the previous navigation, then applies new ones.
 */
let managedHtmlAttrs: string[] = []

function applyHtmlAttributes(attrs: HtmlAttributes | undefined) {
  if (!attrs) return
  const el = document.documentElement

  for (const name of managedHtmlAttrs) {
    if (!(name in attrs)) {
      el.removeAttribute(name === 'className' ? 'class' : name)
    }
  }

  const managed: string[] = []
  for (const [key, value] of Object.entries(attrs)) {
    const attrName = key === 'className' ? 'class' : key
    el.setAttribute(attrName, value)
    managed.push(key)
  }

  managedHtmlAttrs = managed
}

/**
 * Initialize the client-side app with SPA navigation support.
 * Sets up the RouterProvider, hydrates the initial page, and
 * handles client-side navigation by lazy-loading route modules
 * and fetching loader data from /__pareto/data.
 */
export function startClient(
  routes: ClientRoute[],
  options?: {
    notFoundComponent?: React.ComponentType
    errorComponent?: React.ComponentType<{ error: Error }>
  },
) {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Could not find #root element for hydration')
  }

  const matchedRoute = window.__MATCHED_ROUTE__
  const manifest = window.__ROUTE_MANIFEST__ ?? { routes: {} }
  const initialData: unknown = window.__ROUTE_DATA__ ?? {}
  const initialError = window.__ROUTE_ERROR__
    ? new Error(window.__ROUTE_ERROR__)
    : null
  const isInitial404 = !matchedRoute

  // Build lazy components for all routes
  const routeComponents = new Map<
    string,
    React.LazyExoticComponent<React.ComponentType>
  >()
  for (const route of routes) {
    routeComponents.set(route.path, lazy(route.load))
  }

  /**
   * Fetch route data for client-side navigation.
   *
   * For routes using defer(), the server streams NDJSON: the first line
   * contains resolved data + pendingKeys (returned immediately so the page
   * renders), then each deferred value arrives as a subsequent line.
   * We create Promises for pending keys so <Await> shows fallback, then
   * resolve them as stream lines arrive and trigger a loaderData update
   * via RouterProvider.setLoaderData.
   */
  async function fetchRouteData(
    pathname: string,
  ): Promise<FetchRouteDataResult> {
    const response = await fetch(
      `/__pareto/data?path=${encodeURIComponent(pathname)}`,
    )
    if (response.status === 404) {
      return { loaderData: null, params: {}, notFound: true }
    }
    if (!response.ok) {
      return { loaderData: null, params: {}, error: 'Loader failed' }
    }

    const contentType = response.headers.get('content-type') ?? ''

    // Non-deferred: plain JSON
    if (!contentType.includes('ndjson')) {
      const result = (await response.json()) as FetchRouteDataResult
      applyHtmlAttributes(result.htmlAttributes)
      return result
    }

    // NDJSON stream
    const ndjson = createNdjsonReader(response.body!)

    const firstLine = await ndjson.readLine()
    if (!firstLine) {
      return { loaderData: null, params: {}, error: 'Empty stream' }
    }
    const initial = JSON.parse(firstLine) as {
      loaderData: Record<string, unknown>
      params: Record<string, string>
      pendingKeys?: string[]
      htmlAttributes?: HtmlAttributes
      redirect?: string
      error?: string
    }

    applyHtmlAttributes(initial.htmlAttributes)

    if (initial.redirect || initial.error || !initial.pendingKeys?.length) {
      ndjson.cancel()
      return initial as FetchRouteDataResult
    }

    // Create Promises for each pending key — <Await> will suspend on these
    const resolvers = new Map<string, DeferredResolver>()
    const loaderData = { ...initial.loaderData }
    for (const key of initial.pendingKeys) {
      loaderData[key] = new Promise((resolve, reject) => {
        resolvers.set(key, { resolve, reject })
      })
    }

    // Read remaining lines in background, resolving Promises as they arrive
    void (async () => {
      let line: string | null
      while ((line = await ndjson.readLine()) !== null) {
        if (!line) continue
        try {
          const chunk = JSON.parse(line) as {
            key: string
            value?: unknown
            error?: string
          }
          const resolver = resolvers.get(chunk.key)
          if (!resolver) continue
          resolvers.delete(chunk.key)

          if (chunk.error) {
            resolver.reject(new Error(chunk.error))
          } else {
            resolver.resolve(chunk.value)
          }
        } catch {
          // skip malformed lines
        }
      }
      for (const [, resolver] of resolvers) {
        resolver.reject(
          new Error('Stream ended before deferred value resolved'),
        )
      }
    })()

    return {
      loaderData,
      params: initial.params,
      htmlAttributes: initial.htmlAttributes,
    }
  }

  /**
   * Inner content component that consumes the router context.
   * Derives which page to render from the router's pathname —
   * no duplicate state, all updates flow through RouterProvider.
   */
  const NotFoundComponent = options?.notFoundComponent
  const ErrorComponent = options?.errorComponent
  const ErrorFallback = ErrorComponent ?? DefaultErrorFallback

  function AppContent() {
    const router = useRouterContext()

    // Handle client-side 404
    if (router.isNotFound) {
      let element: React.ReactNode = NotFoundComponent ? (
        <NotFoundComponent />
      ) : null
      const rootRoute = routes[0]
      const rootLayouts = rootRoute?.layouts ?? []
      for (let i = rootLayouts.length - 1; i >= 0; i--) {
        const Layout = rootLayouts[i]
        element = <Layout>{element}</Layout>
      }
      return <>{element}</>
    }

    // Handle loader error (server-side or client-side navigation)
    if (router.navigationError) {
      let element: React.ReactNode = (
        <ErrorFallback error={router.navigationError} />
      )

      const errorRoute = matchClientRoute(router.pathname, routes)
      const layouts = errorRoute?.layouts ?? []
      for (let i = layouts.length - 1; i >= 0; i--) {
        const Layout = layouts[i]
        element = <Layout>{element}</Layout>
      }

      return (
        <LoaderDataContext.Provider value={null}>
          {element}
        </LoaderDataContext.Provider>
      )
    }

    // Find matching route from the router's current pathname
    const currentRoute = matchClientRoute(router.pathname, routes)
    const PageComponent = currentRoute
      ? routeComponents.get(currentRoute.path)
      : undefined

    let element: React.ReactNode = PageComponent ? (
      <Suspense fallback={null}>
        <PageComponent />
      </Suspense>
    ) : null

    // Wrap in layouts (innermost to outermost)
    const layouts = currentRoute?.layouts ?? []
    for (let i = layouts.length - 1; i >= 0; i--) {
      const Layout = layouts[i]
      element = <Layout>{element}</Layout>
    }

    return (
      <LoaderDataContext.Provider value={router.loaderData}>
        <RouteHead
          route={currentRoute}
          loaderData={router.loaderData}
          params={router.params}
        />
        {element}
      </LoaderDataContext.Provider>
    )
  }

  // Shell component — creates RouterProvider, AppContent derives state from it
  function App() {
    return (
      <RouterProvider
        initialPathname={window.location.pathname}
        initialParams={matchedRoute?.params ?? {}}
        initialLoaderData={initialData}
        initialError={initialError}
        initialNotFound={isInitial404}
        manifest={manifest}
        onNavigate={fetchRouteData}
      >
        <AppContent />
      </RouterProvider>
    )
  }

  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
