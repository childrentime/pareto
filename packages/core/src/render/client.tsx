import type { ReactNode } from 'react'
import { StrictMode, Suspense, lazy } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { LoaderDataContext } from '../data/use-loader-data'
import { RouterProvider, useRouterContext } from '../router/context'
import type { HeadDescriptor, RouteManifest } from '../types'

declare global {
  interface Window {
    __ROUTE_DATA__: Record<string, unknown>
    __ROUTE_MANIFEST__: RouteManifest
    __MATCHED_ROUTE__: { path: string; params: Record<string, string> }
    __ROUTE_ERROR__?: string
  }
}

/**
 * Hydrate the server-rendered HTML on the client.
 * Called by the auto-generated per-page client entry point.
 */
export function hydrateApp(app: ReactNode) {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Could not find #root element for hydration')
  }

  hydrateRoot(root, <StrictMode>{app}</StrictMode>)
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
}

/** Match a URL pathname to a client route using :param syntax */
function matchClientRoute(
  pathname: string,
  routes: ClientRoute[],
): ClientRoute | undefined {
  return routes.find(r => {
    const pattern = r.path
      .replace(/:(\w+)\*/g, '(.+)')
      .replace(/:(\w+)/g, '([^/]+)')
    return new RegExp(`^${pattern}/?$`).test(pathname)
  })
}

interface FetchRouteDataResult {
  loaderData: unknown
  params: Record<string, string>
  head?: HeadDescriptor
  notFound?: boolean
  error?: string
  deferredKeys?: string[]
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
  },
) {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Could not find #root element for hydration')
  }

  const matchedRoute = window.__MATCHED_ROUTE__
  if (!matchedRoute) {
    console.error('[pareto] No matched route found for hydration')
    return
  }

  const manifest = window.__ROUTE_MANIFEST__ ?? { routes: {} }
  const initialData: unknown = window.__ROUTE_DATA__ ?? {}
  const initialError = window.__ROUTE_ERROR__
    ? new Error(window.__ROUTE_ERROR__)
    : null

  // Build lazy components for all routes
  const routeComponents = new Map<
    string,
    React.LazyExoticComponent<React.ComponentType>
  >()
  for (const route of routes) {
    routeComponents.set(route.path, lazy(route.load))
  }

  // Pure data fetcher — no state updates, just returns data.
  // For deferred loaders, creates client-side Promises so <Await> shows fallbacks.
  async function fetchRouteData(pathname: string): Promise<{
    loaderData: unknown
    params: Record<string, string>
    head?: HeadDescriptor
    notFound?: boolean
    error?: string
  }> {
    const response = await fetch(
      `/__pareto/data?path=${encodeURIComponent(pathname)}`,
    )
    if (response.status === 404) {
      return { loaderData: null, params: {}, notFound: true }
    }
    if (!response.ok) {
      return { loaderData: null, params: {}, error: 'Loader failed' }
    }
    const result = (await response.json()) as FetchRouteDataResult

    // If the server indicated deferred keys, create client-side Promises
    // that fetch each key individually. <Await> renders fallback until resolved.
    if (result.deferredKeys?.length) {
      const loaderData = result.loaderData as Record<string, unknown>
      for (const key of result.deferredKeys) {
        loaderData[key] = fetch(
          `/__pareto/deferred?path=${encodeURIComponent(pathname)}&key=${encodeURIComponent(key)}`,
        )
          .then(r => r.json() as Promise<{ value: unknown }>)
          .then(r => r.value)
      }
    }

    return result
  }

  /**
   * Inner content component that consumes the router context.
   * Derives which page to render from the router's pathname —
   * no duplicate state, all updates flow through RouterProvider.
   */
  const NotFoundComponent = options?.notFoundComponent

  function AppContent() {
    const router = useRouterContext()

    // Handle client-side 404
    if (router.isNotFound) {
      let element: React.ReactNode = NotFoundComponent ? (
        <NotFoundComponent />
      ) : null
      // Wrap in root layout if available
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
        <div
          style={{
            padding: '2rem',
            maxWidth: '32rem',
            margin: '4rem auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              color: '#dc2626',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#666',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {router.navigationError.message}
          </p>
          <a
            href="/"
            style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Go Home
          </a>
        </div>
      )

      // Wrap in layouts to match the server-rendered tree
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
        {element}
      </LoaderDataContext.Provider>
    )
  }

  // Shell component — creates RouterProvider, AppContent derives state from it
  function App() {
    return (
      <RouterProvider
        initialPathname={window.location.pathname}
        initialParams={matchedRoute.params}
        initialLoaderData={initialData}
        initialError={initialError}
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
