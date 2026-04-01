import type { RouteDef, RouteMatch } from '../types'

/**
 * Convert a route path pattern (e.g. "/blog/:slug", "/docs/:path*")
 * into a RegExp. Single source of truth for all client/server matching.
 */
export function pathToRegex(routePath: string): RegExp {
  const pattern = routePath
    .replace(/:(\w+)\*/g, '(.+)')
    .replace(/:(\w+)/g, '([^/]+)')
  return new RegExp(`^${pattern}/?$`)
}

/**
 * Match a URL pathname against a list of route definitions.
 * Routes should already be sorted by specificity (scanRoutes does this).
 * Returns the first match with extracted params, or null.
 */
export function matchRoute(
  pathname: string,
  routes: RouteDef[],
): RouteMatch | null {
  const normalized = normalizePath(pathname)

  for (const route of routes) {
    const match = route.pattern.exec(normalized)
    if (match) {
      const params: Record<string, string> = {}
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1])
      })
      return { route, params }
    }
  }

  return null
}

export function normalizePath(pathname: string): string {
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname
  }
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }
  return pathname
}
