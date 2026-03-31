import type { Request, Response } from 'express'
import type { ReactNode } from 'react'
import type { UserConfig } from 'vite'

// --- Route Types ---

export interface RouteDef {
  path: string
  pattern: RegExp
  paramNames: string[]
  segments: string[]
  componentPath: string
  layoutPaths: string[]
  /** All head.tsx paths from root to page directory */
  headPaths: string[]
  loaderPath?: string
  isDynamic: boolean
  isCatchAll: boolean
  /** True if this is a resource route (route.ts without page.tsx) — returns raw data, no HTML */
  isResource: boolean
}

export interface RouteMatch {
  route: RouteDef
  params: Record<string, string>
}

// --- Loader Types ---

export interface LoaderContext {
  req: Request
  res: Response
  params: Record<string, string>
}

export type LoaderFunction = (context: LoaderContext) => unknown

// --- Deferred Data ---

/**
 * Wraps an object whose values may be Promises.
 * Resolved values are sent in the initial shell; unresolved ones
 * stream in later inside <Suspense> boundaries.
 */
export class DeferredData<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  public data: T
  constructor(data: T) {
    this.data = data
  }
}

/**
 * Mark loader return data for streaming. Values that are already resolved
 * are included in the initial HTML shell. Values that are Promises will
 * stream in as they resolve (used with the <Await> component).
 *
 * @example
 * ```ts
 * export async function loader({ params }) {
 *   const user = await getUser(params.id)
 *   return defer({
 *     user,                          // resolved — in shell
 *     activity: getActivity(user.id), // Promise — streams later
 *   })
 * }
 * ```
 */
export function defer<T extends Record<string, unknown>>(
  data: T,
): DeferredData<T> {
  return new DeferredData(data)
}

// --- Response Helpers ---

/**
 * Throw in a loader/action to redirect the client.
 * @example
 * ```ts
 * export function loader({ req }) {
 *   if (!req.cookies.token) throw redirect('/login')
 *   return { user }
 * }
 * ```
 */
export class ParetoRedirect {
  constructor(
    public url: string,
    public status = 302,
  ) {}
}

/**
 * Throw in a loader/action to render the not-found page.
 * @example
 * ```ts
 * export function loader({ params }) {
 *   const post = await db.getPost(params.slug)
 *   if (!post) throw notFound()
 *   return { post }
 * }
 * ```
 */
export class ParetoNotFound {}

/** Throw to redirect from a loader or action. */
export function redirect(url: string, status = 302): never {
  throw new ParetoRedirect(url, status)
}

/** Throw to render the not-found page from a loader or action. */
export function notFound(): never {
  throw new ParetoNotFound()
}

// --- Config Types ---

export interface ParetoConfig {
  appDir?: string
  outDir?: string
  configureVite?: (
    config: UserConfig,
    context: { isServer: boolean },
  ) => UserConfig
  /**
   * Inject a hidden element with 200+ zero-width characters into the HTML
   * shell to force iOS WKWebView to begin rendering before the stream
   * completes.
   *
   * WebKit delays first paint until visible text exceeds 200 characters
   * (WebCore `FrameView::visualCharacterThreshold`). For pages with
   * minimal text (dashboards, skeleton screens, image-heavy layouts),
   * this threshold may not be met in the initial shell, causing a white
   * flash in iOS apps that use WKWebView.
   *
   * Trade-offs:
   * - Adds ~220 bytes of zero-width spaces to the HTML payload.
   * - Uses `aria-hidden="true"` so screen readers ignore it.
   * - No visual effect (zero-width chars in a 0×0 overflow-hidden div).
   * - Only relevant for pages loaded inside iOS WKWebView (native apps).
   *   Safari / Chrome browsers are not affected.
   *
   * @default false
   * @see https://github.com/xiaoxiaojx/blog/issues/37
   */
  wkWebViewFlushHint?: boolean
}

// --- Document Types ---

/**
 * Context passed to `getDocumentProps` in `app/document.tsx`.
 * Use this to derive `<html>` attributes from the current request.
 *
 * @example
 * ```ts
 * export function getDocumentProps(ctx: DocumentContext) {
 *   const lang = ctx.params.lang || 'en'
 *   return { lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }
 * }
 * ```
 */
export interface DocumentContext {
  req: Request
  params: Record<string, string>
  pathname: string
  loaderData: unknown
}

/**
 * Attributes applied to the `<html>` element.
 * Returned by `getDocumentProps` in `app/document.tsx`.
 */
export type HtmlAttributes = Record<string, string> & {
  lang?: string
  dir?: string
  className?: string
}

/** Signature of the user-exported function in `app/document.tsx`. */
export type GetDocumentProps = (ctx: DocumentContext) => HtmlAttributes

// --- Head Types ---

export interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}

export type HeadComponent = (props: HeadProps) => ReactNode

// --- Route Manifest (serialized for client) ---

export interface RouteManifestEntry {
  path: string
  paramNames: string[]
  hasLoader: boolean
  hasHead: boolean
  /** Chunk URLs for the page component */
  js?: string[]
  css?: string[]
}

export interface RouteManifest {
  routes: Record<string, RouteManifestEntry>
}

// --- Client Router Types ---

export interface NavigateOptions {
  replace?: boolean
  scroll?: boolean
}

export interface RouterState {
  pathname: string
  params: Record<string, string>
  isNavigating: boolean
}
