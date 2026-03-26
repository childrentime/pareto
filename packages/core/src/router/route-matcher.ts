import type { RouteDef, RouteMatch } from '../types'

/**
 * Match a URL pathname against a list of route definitions.
 * Routes should already be sorted by specificity (scanRoutes does this).
 * Returns the first match with extracted params, or null.
 */
export function matchRoute(
  pathname: string,
  routes: RouteDef[],
): RouteMatch | null {
  // Normalize: ensure leading slash, strip trailing slash (unless root)
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

/**
 * Match a route specifically by its path pattern (e.g., "/blog/[slug]").
 * Used when the client already knows which route pattern it needs.
 */
export function matchRouteByPath(
  routePath: string,
  routes: RouteDef[],
): RouteDef | null {
  return routes.find((r) => r.path === routePath) ?? null
}

/**
 * Given two route matches, determine which layout segments are shared
 * (and thus don't need to re-render or re-fetch on navigation).
 * Returns the indices of segments that changed.
 */
export function diffLayouts(
  from: RouteMatch | null,
  to: RouteMatch,
): { shared: string[]; changed: string[] } {
  if (!from) {
    return { shared: [], changed: to.route.layoutPaths }
  }

  const shared: string[] = []
  const changed: string[] = []

  for (let i = 0; i < to.route.layoutPaths.length; i++) {
    const toLayout = to.route.layoutPaths[i]
    const fromLayout = from.route.layoutPaths[i]

    if (fromLayout === toLayout) {
      shared.push(toLayout)
    } else {
      // Once layouts diverge, everything from here down is changed
      changed.push(...to.route.layoutPaths.slice(i))
      break
    }
  }

  return { shared, changed }
}

function normalizePath(pathname: string): string {
  if (!pathname.startsWith('/')) {
    pathname = '/' + pathname
  }
  // Remove trailing slash unless root
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1)
  }
  return pathname
}
