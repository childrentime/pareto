import type { Request, Response } from 'express'
import { Suspense } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import serialize from 'serialize-javascript'
import { isDeferredData, serializeDeferredData } from '../data/streaming'
import { LoaderDataContext } from '../data/use-loader-data'
import { RouterProvider } from '../router/context'
import { mergeHeadDescriptors } from '../router/head-manager'
import { matchRoute } from '../router/route-matcher'
import type {
  HeadDescriptor,
  HeadFunction,
  LoaderFunction,
  RouteDef,
  RouteManifest,
} from '../types'
import { ParetoNotFound, ParetoRedirect } from '../types'
import { DeferredScript } from './deferred-script'
import type { ScriptDescriptor } from './document'
import { Document } from './document'

const REACT_REFRESH_PREAMBLE = `import RefreshRuntime from '/@react-refresh'
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`

interface ServerRenderOptions {
  routes: RouteDef[]
  manifest: RouteManifest
  /** Resolve a file path to a loaded module */
  requireModule: (filePath: string) => unknown
  /** Client entry JS URL(s) — loaded as ES modules */
  clientEntry: string[]
  /** CSS URLs for the matched route */
  getCssForRoute?: (route: RouteDef) => string[]
  /** JS URLs for the matched route */
  getJsForRoute?: (route: RouteDef) => string[]
  /** Global CSS URLs to inject in <head> (dev mode — prevents FOUC) */
  cssUrls?: string[]
  /** Timeout before aborting streaming (default: 10000) */
  streamTimeout?: number
  /** Path to not-found.tsx component (app-level 404 page) */
  notFoundPath?: string
}

/**
 * Create the Pareto request handler for Express.
 */
export function createRequestHandler(options: ServerRenderOptions) {
  const {
    routes,
    manifest,
    requireModule,
    clientEntry,
    getCssForRoute,
    getJsForRoute,
    cssUrls = [],
    streamTimeout = 10000,
    notFoundPath,
  } = options

  return async (req: Request, res: Response, next?: () => void) => {
    // Data endpoint for client-side navigation
    if (req.path === '/__pareto/data') {
      return handleDataRequest(req, res, routes, requireModule)
    }

    // Deferred data endpoint — resolve a single deferred key
    if (req.path === '/__pareto/deferred') {
      return handleDeferredRequest(req, res, routes, requireModule)
    }

    // Route matching
    const match = matchRoute(req.path, routes)
    if (!match) {
      // No route matched — render not-found.tsx if available
      if (notFoundPath) {
        return renderNotFound(req, res, {
          notFoundPath,
          manifest,
          requireModule,
          clientEntry,
          getCssForRoute,
          cssUrls,
          streamTimeout,
        })
      }
      if (next) return next()
      res.status(404)
      res.end('Not Found')
      return
    }

    const { route, params } = match

    // Resource routes: return raw data, no HTML rendering
    if (route.isResource) {
      return handleResourceRoute(req, res, route, params, requireModule)
    }

    // Run loaders with error handling
    let loaderData: unknown
    let loaderError: Error | undefined
    let statusCode = 200

    try {
      loaderData = await runLoaders(route, params, req, res, requireModule)
    } catch (err) {
      // Redirect — send HTTP redirect response
      if (err instanceof ParetoRedirect) {
        res.redirect(err.status, err.url)
        return
      }
      // Not found — render 404 page
      if (err instanceof ParetoNotFound) {
        if (notFoundPath) {
          return renderNotFound(req, res, {
            notFoundPath,
            manifest,
            requireModule,
            clientEntry,
            getCssForRoute,
            cssUrls,
            streamTimeout,
          })
        }
        res.status(404).end('Not Found')
        return
      }
      // Other error — will render with error boundary
      loaderError = err instanceof Error ? err : new Error(String(err))
      statusCode = 500
      console.error('[pareto] Loader error:', loaderError)
    }

    // Resolve head descriptors
    const head = loaderError
      ? undefined
      : resolveHead(route, loaderData, params, requireModule)

    // Resolve loader data (unwrap DeferredData for the component tree)
    const resolvedLoaderData = loaderError
      ? undefined
      : isDeferredData(loaderData)
        ? loaderData.data
        : loaderData

    // Build the component tree
    let element: React.ReactNode

    if (loaderError) {
      // Loader threw — render a minimal error page
      element = (
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
            {loaderError.message}
          </p>
          <a
            href="/"
            style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Go Home
          </a>
        </div>
      )
    } else {
      // Normal render — page component
      const pageMod = requireModule(route.componentPath) as Record<
        string,
        unknown
      >
      const Page = pageMod.default as React.ComponentType

      element = (
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      )
    }

    // Wrap in layouts (innermost to outermost)
    for (let i = route.layoutPaths.length - 1; i >= 0; i--) {
      const layoutMod = requireModule(route.layoutPaths[i]) as Record<
        string,
        unknown
      >
      const Layout = layoutMod.default as React.ComponentType<{
        children: React.ReactNode
      }>
      element = <Layout>{element}</Layout>
    }

    // Single LoaderDataContext wrapping everything
    element = (
      <LoaderDataContext.Provider value={resolvedLoaderData}>
        {element}
      </LoaderDataContext.Provider>
    )

    // Wrap in RouterProvider for <Link> support during SSR
    const wrappedTree = (
      <RouterProvider
        initialPathname={req.path}
        initialParams={params}
        initialLoaderData={resolvedLoaderData}
        manifest={manifest}
      >
        {element}
      </RouterProvider>
    )

    // Collect deferred promises for streaming
    const deferredScripts: React.ReactNode[] = []
    if (!loaderError && isDeferredData(loaderData)) {
      const { pendingKeys } = serializeDeferredData(loaderData)
      for (const key of pendingKeys) {
        const promise = loaderData.data[key] as Promise<unknown>
        deferredScripts.push(
          <Suspense key={key} fallback={null}>
            <DeferredScript dataKey={key} promise={promise} />
          </Suspense>,
        )
      }
    }

    // Prepare assets
    const cssLinks = [...cssUrls, ...(getCssForRoute?.(route) ?? [])]
    const jsPreloads = getJsForRoute?.(route) ?? []

    // Serialize initial data for hydration
    const serializedData = loaderError
      ? null
      : isDeferredData(loaderData)
        ? serializeDeferredData(loaderData).resolved
        : loaderData

    const dataScript = (
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: [
            `window.__ROUTE_DATA__=${serialize(serializedData ?? null, { isJSON: true })};`,
            `window.__ROUTE_MANIFEST__=${serialize(manifest, { isJSON: true })};`,
            `window.__MATCHED_ROUTE__=${serialize({ path: route.path, params }, { isJSON: true })};`,
            loaderError
              ? `window.__ROUTE_ERROR__=${serialize(loaderError.message, { isJSON: true })};`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        }}
      />
    )

    // Build scripts array
    const isDev = process.env.NODE_ENV !== 'production'
    const scripts: ScriptDescriptor[] = []
    if (isDev) {
      scripts.push({ content: REACT_REFRESH_PREAMBLE })
    }
    for (const src of clientEntry) {
      if (src) scripts.push({ src })
    }

    // Full document
    const doc = (
      <Document
        head={head}
        cssLinks={cssLinks}
        jsPreloads={jsPreloads}
        scripts={scripts}
        dataScript={dataScript}
      >
        {wrappedTree}
        {deferredScripts}
      </Document>
    )

    // Stream the response
    res.setHeader('Content-Type', 'text/html; charset=UTF-8')
    res.setHeader('X-Accel-Buffering', 'no')

    const { pipe, abort } = renderToPipeableStream(doc, {
      onShellReady() {
        res.statusCode = statusCode
        pipe(res)
      },
      onShellError(error) {
        console.error('Shell render error:', error)
        res.statusCode = 500
        res.end('Internal Server Error')
      },
      onError(error) {
        console.error('Streaming render error:', error)
      },
    })

    setTimeout(() => abort(), streamTimeout)
  }
}

/** Render the not-found.tsx page with a 404 status */
function renderNotFound(
  req: Request,
  res: Response,
  opts: {
    notFoundPath: string
    manifest: RouteManifest
    requireModule: (path: string) => unknown
    clientEntry: string[]
    getCssForRoute?: (route: RouteDef) => string[]
    cssUrls: string[]
    streamTimeout: number
  },
) {
  const {
    notFoundPath,
    manifest,
    requireModule,
    clientEntry,
    cssUrls,
    streamTimeout,
  } = opts
  const notFoundMod = requireModule(notFoundPath) as Record<string, unknown>
  const NotFound = notFoundMod.default as React.ComponentType

  const element = (
    <RouterProvider
      initialPathname={req.path}
      initialParams={{}}
      initialLoaderData={undefined}
      manifest={manifest}
    >
      <LoaderDataContext.Provider value={undefined}>
        <NotFound />
      </LoaderDataContext.Provider>
    </RouterProvider>
  )

  const isDev = process.env.NODE_ENV !== 'production'
  const scripts: ScriptDescriptor[] = []
  if (isDev) {
    scripts.push({ content: REACT_REFRESH_PREAMBLE })
  }
  for (const src of clientEntry) {
    if (src) scripts.push({ src })
  }

  const dataScript = (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `window.__ROUTE_DATA__=null;\nwindow.__ROUTE_MANIFEST__=${serialize(manifest, { isJSON: true })};\nwindow.__MATCHED_ROUTE__=null;`,
      }}
    />
  )

  const doc = (
    <Document cssLinks={cssUrls} scripts={scripts} dataScript={dataScript}>
      {element}
    </Document>
  )

  res.setHeader('Content-Type', 'text/html; charset=UTF-8')

  const { pipe, abort } = renderToPipeableStream(doc, {
    onShellReady() {
      res.statusCode = 404
      pipe(res)
    },
    onShellError(error) {
      console.error('Not-found render error:', error)
      res.statusCode = 500
      res.end('Internal Server Error')
    },
    onError(error) {
      console.error('Not-found streaming error:', error)
    },
  })

  setTimeout(() => abort(), streamTimeout)
}

/** Handle resource routes (route.ts without page.tsx) — return raw data */
async function handleResourceRoute(
  req: Request,
  res: Response,
  route: RouteDef,
  params: Record<string, string>,
  requireModule: (path: string) => unknown,
) {
  const routeMod = requireModule(route.componentPath) as Record<string, unknown>

  // POST/PUT/PATCH/DELETE → action
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const actionFn = (routeMod.action ?? routeMod.default) as
      | LoaderFunction
      | undefined
    if (!actionFn) {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }
    try {
      const result: unknown = await actionFn({ req, res, params })
      if (!res.headersSent) {
        res.json(result ?? { ok: true })
      }
    } catch (err) {
      if (err instanceof ParetoRedirect) {
        res.redirect(err.status, err.url)
        return
      }
      console.error('Resource action error:', err)
      res.status(500).json({ error: 'Action failed' })
    }
    return
  }

  // GET/HEAD → loader
  const loaderFn = (routeMod.loader ?? routeMod.default) as
    | LoaderFunction
    | undefined
  if (!loaderFn) {
    res.status(405).json({ error: 'No loader defined' })
    return
  }
  try {
    const result: unknown = await loaderFn({ req, res, params })
    if (!res.headersSent) {
      res.json(result ?? null)
    }
  } catch (err) {
    if (err instanceof ParetoRedirect) {
      res.redirect(err.status, err.url)
      return
    }
    console.error('Resource loader error:', err)
    res.status(500).json({ error: 'Loader failed' })
  }
}

/** Handle /__pareto/data requests for client-side navigation */
async function handleDataRequest(
  req: Request,
  res: Response,
  routes: RouteDef[],
  requireModule: (path: string) => unknown,
) {
  const rawPath = req.query.path as string
  if (!rawPath) {
    res.status(400).json({ error: 'Missing path parameter' })
    return
  }

  // Strip query string for route matching, merge query params onto req
  const [targetPath, queryString] = rawPath.split('?')
  if (queryString) {
    const extra = new URLSearchParams(queryString)
    for (const [k, v] of extra) {
      req.query[k] = v
    }
  }

  const match = matchRoute(targetPath, routes)
  if (!match) {
    res.status(404).json({ error: 'Route not found' })
    return
  }

  const { route, params } = match

  try {
    const loaderData = await runLoaders(route, params, req, res, requireModule)
    const head = resolveHead(route, loaderData, params, requireModule)

    // For deferred data, return resolved values immediately and mark pending keys.
    // The client will fetch each pending key via /__pareto/deferred.
    let resolvedData = loaderData
    let deferredKeys: string[] | undefined
    if (isDeferredData(loaderData)) {
      const { resolved, pendingKeys } = serializeDeferredData(loaderData)
      resolvedData = resolved
      if (pendingKeys.length > 0) {
        deferredKeys = pendingKeys
      }
    }

    res.json({ loaderData: resolvedData, head, params, deferredKeys })
  } catch (err) {
    if (err instanceof ParetoRedirect) {
      res.json({ redirect: err.url, status: err.status })
      return
    }
    if (err instanceof ParetoNotFound) {
      res.status(404).json({ error: 'Not found' })
      return
    }
    console.error('[pareto] Data request error:', err)
    res.status(500).json({ error: 'Loader failed' })
  }
}

/** Handle /__pareto/deferred — resolve a single deferred key from a route's loader */
async function handleDeferredRequest(
  req: Request,
  res: Response,
  routes: RouteDef[],
  requireModule: (path: string) => unknown,
) {
  const targetPath = req.query.path as string
  const key = req.query.key as string
  if (!targetPath || !key) {
    res.status(400).json({ error: 'Missing path or key parameter' })
    return
  }

  const match = matchRoute(targetPath, routes)
  if (!match) {
    res.status(404).json({ error: 'Route not found' })
    return
  }

  try {
    const loaderData = await runLoaders(
      match.route,
      match.params,
      req,
      res,
      requireModule,
    )
    if (!isDeferredData(loaderData)) {
      res.status(400).json({ error: 'Route does not use defer()' })
      return
    }
    const value: unknown = loaderData.data[key]
    const resolved: unknown = value instanceof Promise ? await value : value
    res.json({ key, value: resolved })
  } catch (err) {
    console.error('[pareto] Deferred request error:', err)
    res.status(500).json({ error: 'Deferred fetch failed' })
  }
}

/** Run loaders for a matched route */
function runLoaders(
  route: RouteDef,
  params: Record<string, string>,
  req: Request,
  res: Response,
  requireModule: (path: string) => unknown,
): unknown {
  // Check separate loader file first
  if (route.loaderPath) {
    const loaderMod = requireModule(route.loaderPath) as Record<string, unknown>
    const loaderFn = (loaderMod.loader ?? loaderMod.default) as
      | LoaderFunction
      | undefined
    if (loaderFn) return loaderFn({ req, res, params })
  }

  // Fallback: check page module's loader export
  const pageMod = requireModule(route.componentPath) as Record<string, unknown>
  if (pageMod.loader) {
    return (pageMod.loader as LoaderFunction)({ req, res, params })
  }

  return undefined
}

/** Resolve head descriptors for the matched route, merging from all headPaths */
function resolveHead(
  route: RouteDef,
  loaderData: unknown,
  params: Record<string, string>,
  requireModule: (path: string) => unknown,
): HeadDescriptor | undefined {
  const paths =
    route.headPaths.length > 0
      ? route.headPaths
      : route.headPath
        ? [route.headPath]
        : []
  if (paths.length === 0) return undefined

  const resolvedData = isDeferredData(loaderData) ? loaderData.data : loaderData

  const heads: HeadDescriptor[] = []
  for (const headPath of paths) {
    const headMod = requireModule(headPath) as Record<string, unknown>
    const headFn = (headMod.head ?? headMod.default) as HeadFunction | undefined
    if (headFn) {
      heads.push(headFn({ loaderData: resolvedData, params }))
    }
  }

  if (heads.length === 0) return undefined
  if (heads.length === 1) return heads[0]
  return mergeHeadDescriptors(...heads)
}
