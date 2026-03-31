import type { Request, Response } from 'express'
import type { ReactElement, ReactNode } from 'react'
import { createElement, Fragment, isValidElement, Suspense } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import serialize from 'serialize-javascript'
import { isDeferredData, serializeDeferredData } from '../data/streaming'
import { LoaderDataContext } from '../data/use-loader-data'
import { HEAD_ATTR } from '../head/constants'
import { dedupeHeadElements, flattenHeadChildren } from '../head/dedupe'
import { resolveServerHead } from '../head/server-head'
import { createNdjsonWriter } from '../ndjson/writer'
import { RouterProvider } from '../router/context'
import { matchRoute } from '../router/route-matcher'
import type {
  GetDocumentProps,
  HeadComponent,
  HtmlAttributes,
  LoaderFunction,
  RouteDef,
  RouteManifest,
} from '../types'
import { ParetoNotFound, ParetoRedirect } from '../types'
import { DefaultErrorFallback } from './default-error-fallback'
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
  /** Path to error.tsx component (app-level error page) */
  errorPath?: string
  /** Path to root head.tsx (used for 404/error pages that have no matched route) */
  rootHeadPath?: string
  /** Path to document.tsx (provides getDocumentProps for <html> attributes) */
  documentPath?: string
  /** @see ParetoConfig.wkWebViewFlushHint */
  wkWebViewFlushHint?: boolean
}

/** Build the client-entry script descriptors (dev preamble + entry URLs) */
function buildScripts(clientEntry: string[]): ScriptDescriptor[] {
  const scripts: ScriptDescriptor[] = []
  if (process.env.NODE_ENV !== 'production') {
    scripts.push({ content: REACT_REFRESH_PREAMBLE })
  }
  for (const src of clientEntry) {
    if (src) scripts.push({ src })
  }
  return scripts
}

/** Stream a Document to the response with renderToPipeableStream */
function streamDocument(
  res: Response,
  doc: React.ReactElement,
  statusCode: number,
  streamTimeout: number,
  label = 'Render',
) {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8')
  if (statusCode === 200) {
    res.setHeader('X-Accel-Buffering', 'no')
  }

  const { pipe, abort } = renderToPipeableStream(doc, {
    onShellReady() {
      res.statusCode = statusCode
      pipe(res)
    },
    onShellError(error) {
      console.error(`${label} shell error:`, error)
      res.statusCode = 500
      res.end('Internal Server Error')
    },
    onError(error) {
      const msg = error instanceof Error ? error.message : ''
      if (msg.includes('closed early') || msg.includes('aborted')) return
      console.error(`${label} streaming error:`, error)
    },
  })

  setTimeout(() => abort(), streamTimeout)
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
    errorPath,
    rootHeadPath,
    documentPath,
    wkWebViewFlushHint = false,
  } = options

  const scripts = buildScripts(clientEntry)

  // Resolve the user's getDocumentProps function (if app/document.tsx exists)
  let getDocumentProps: GetDocumentProps | undefined
  if (documentPath) {
    const docMod = requireModule(documentPath) as Record<string, unknown>
    getDocumentProps = (docMod.getDocumentProps ?? docMod.default) as
      | GetDocumentProps
      | undefined
  }

  function resolveHtmlAttributes(
    req: Request,
    params: Record<string, string>,
    loaderData: unknown,
  ): HtmlAttributes {
    if (!getDocumentProps) return {}
    return getDocumentProps({
      req,
      params,
      pathname: req.path,
      loaderData,
    })
  }

  function renderNotFoundPage(req: Request, res: Response) {
    if (!notFoundPath) return false

    const notFoundMod = requireModule(notFoundPath) as Record<string, unknown>
    const NotFound = notFoundMod.default as React.ComponentType

    let headContent: ReactNode = null
    if (rootHeadPath) {
      const headMod = requireModule(rootHeadPath) as Record<string, unknown>
      const Head = headMod.default as HeadComponent | undefined
      if (Head) {
        const children = flattenHeadChildren(
          Head({ loaderData: undefined, params: {} }),
        )
        const deduped = dedupeHeadElements(children)
        headContent =
          deduped.length > 0
            ? createElement(
                Fragment,
                null,
                ...deduped.map((node, i) => {
                  if (!isValidElement(node)) return node
                  const el = node as ReactElement<Record<string, unknown>>
                  return createElement(el.type as string, {
                    ...el.props,
                    [HEAD_ATTR]: '',
                    key: el.key ?? `head-${i}`,
                  })
                }),
              )
            : null
      }
    }

    const htmlAttributes = resolveHtmlAttributes(req, {}, undefined)

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

    const dataScript = (
      <script
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: `window.__ROUTE_DATA__=null;\nwindow.__ROUTE_MANIFEST__=${serialize(manifest, { isJSON: true })};\nwindow.__MATCHED_ROUTE__=null;`,
        }}
      />
    )

    const doc = (
      <Document
        headContent={headContent}
        cssLinks={cssUrls}
        scripts={scripts}
        dataScript={dataScript}
        htmlAttributes={htmlAttributes}
        wkWebViewFlushHint={wkWebViewFlushHint}
      >
        {element}
      </Document>
    )

    streamDocument(res, doc, 404, streamTimeout, 'Not-found')
    return true
  }

  return async (req: Request, res: Response, next?: () => void) => {
    // Data endpoint for client-side navigation
    if (req.path === '/__pareto/data') {
      return handleDataRequest(
        req,
        res,
        routes,
        requireModule,
        getDocumentProps,
      )
    }

    // Route matching
    const match = matchRoute(req.path, routes)
    if (!match) {
      if (renderNotFoundPage(req, res)) return
      if (next) return next()
      res.status(404).end('Not Found')
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
      if (err instanceof ParetoRedirect) {
        res.redirect(err.status, err.url)
        return
      }
      if (err instanceof ParetoNotFound) {
        if (renderNotFoundPage(req, res)) return
        res.status(404).end('Not Found')
        return
      }
      loaderError = err instanceof Error ? err : new Error(String(err))
      statusCode = 500
      console.error('[pareto] Loader error:', loaderError)
    }

    const htmlAttributes = resolveHtmlAttributes(
      req,
      params,
      loaderError ? undefined : loaderData,
    )

    const headContent = resolveServerHead(
      route,
      loaderError ? undefined : loaderData,
      params,
      requireModule,
    )

    const resolvedLoaderData = loaderError
      ? undefined
      : isDeferredData(loaderData)
        ? loaderData.data
        : loaderData

    // Build the component tree
    let element: React.ReactNode

    if (loaderError) {
      if (errorPath) {
        const errorMod = requireModule(errorPath) as Record<string, unknown>
        const ErrorPage = errorMod.default as React.ComponentType<{
          error: Error
        }>
        element = <ErrorPage error={loaderError} />
      } else {
        element = <DefaultErrorFallback error={loaderError} />
      }
    } else {
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

    element = (
      <LoaderDataContext.Provider value={resolvedLoaderData}>
        {element}
      </LoaderDataContext.Provider>
    )

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

    const cssLinks = [...cssUrls, ...(getCssForRoute?.(route) ?? [])]
    const jsPreloads = getJsForRoute?.(route) ?? []

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

    const doc = (
      <Document
        headContent={headContent}
        cssLinks={cssLinks}
        jsPreloads={jsPreloads}
        scripts={scripts}
        dataScript={dataScript}
        htmlAttributes={htmlAttributes}
        wkWebViewFlushHint={wkWebViewFlushHint}
      >
        {wrappedTree}
        {deferredScripts}
      </Document>
    )

    streamDocument(res, doc, statusCode, streamTimeout)
  }
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

/**
 * Handle /__pareto/data requests for client-side navigation.
 *
 * For non-deferred loaders, responds with plain JSON.
 * For deferred loaders, uses the NDJSON writer (see `ndjson/writer.ts`)
 * to stream resolved data immediately, then each deferred value as it
 * resolves. The client consumes this via `ndjson/reader.ts`.
 */
async function handleDataRequest(
  req: Request,
  res: Response,
  routes: RouteDef[],
  requireModule: (path: string) => unknown,
  getDocumentProps?: GetDocumentProps,
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

    if (!isDeferredData(loaderData)) {
      // No deferred keys — plain JSON response (no streaming needed)
      const htmlAttributes = getDocumentProps
        ? getDocumentProps({ req, params, pathname: targetPath, loaderData })
        : undefined
      res.json({ loaderData, params, htmlAttributes })
      return
    }

    // Deferred data: stream via NDJSON
    const { resolved, pendingKeys } = serializeDeferredData(loaderData)

    const htmlAttributes = getDocumentProps
      ? getDocumentProps({
          req,
          params,
          pathname: targetPath,
          loaderData: resolved,
        })
      : undefined

    const writer = createNdjsonWriter(res)
    writer.writeInitial({
      loaderData: resolved,
      params,
      pendingKeys,
      htmlAttributes,
    })

    await Promise.all(
      pendingKeys.map(async key => {
        try {
          const value = await (loaderData.data[key] as Promise<unknown>)
          writer.writeChunk({ key, value })
        } catch (err) {
          writer.writeChunk({
            key,
            error: err instanceof Error ? err.message : 'Deferred value failed',
          })
        }
      }),
    )

    writer.end()
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
