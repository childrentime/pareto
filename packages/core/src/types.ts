import type { Request, Response } from 'express'
import type { UserConfig } from 'vite'

// --- Route Types ---

export interface RouteModule {
  default: React.ComponentType<any>
  loader?: LoaderFunction
  config?: RouteConfig
  staticParams?: () => Promise<Record<string, string>[]>
  Head?: React.ComponentType<{ data: any }>
}

export interface RouteConfig {
  render?: 'server' | 'static'
  revalidate?: {
    onFocus?: boolean
    interval?: number
    onNavigate?: boolean
  }
}

export interface RouteDef {
  path: string
  pattern: RegExp
  paramNames: string[]
  segments: string[]
  componentPath: string
  layoutPaths: string[]
  headPath?: string
  /** All head.tsx paths from root to page directory (for merging) */
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

export type LoaderFunction = (
  context: LoaderContext,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
) => Promise<any> | any

// --- Deferred Data ---

/**
 * Wraps an object whose values may be Promises.
 * Resolved values are sent in the initial shell; unresolved ones
 * stream in later inside <Suspense> boundaries.
 */
export class DeferredData<T extends Record<string, unknown> = Record<string, unknown>> {
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
export function defer<T extends Record<string, unknown>>(data: T): DeferredData<T> {
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
  constructor(public url: string, public status = 302) {}
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
}

// --- Head Types ---

export interface HeadDescriptor {
  title?: string
  meta?: Record<string, string>[]
  link?: Record<string, string>[]
}

export type HeadFunction = (ctx: { loaderData: any; params: Record<string, string> }) => HeadDescriptor

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
