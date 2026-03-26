import fs from 'fs'
import path from 'path'
import type { RouteDef } from '../types'

const ROUTE_FILES = {
  page: 'page.tsx',
  route: 'route.ts',
  layout: 'layout.tsx',
  head: 'head.tsx',
  loader: 'loader.ts',
  notFound: 'not-found.tsx',
} as const

/**
 * Scan the app directory and build a flat list of route definitions.
 * Directories with a page.tsx become routes. layout.tsx files in
 * parent directories wrap their children.
 */
export function scanRoutes(appDir: string): RouteDef[] {
  const routes: RouteDef[] = []
  walkDir(appDir, appDir, [], routes)

  // Sort: static routes first, then dynamic, then catch-all.
  // Longer specificity wins within each group.
  routes.sort((a, b) => {
    if (a.isCatchAll !== b.isCatchAll) return a.isCatchAll ? 1 : -1
    if (a.isDynamic !== b.isDynamic) return a.isDynamic ? 1 : -1
    // More segments = more specific = higher priority
    return b.segments.length - a.segments.length
  })

  return routes
}

function walkDir(
  baseDir: string,
  currentDir: string,
  parentSegments: string[],
  routes: RouteDef[],
) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })

  const hasPage = entries.some(
    (e) => e.isFile() && e.name === ROUTE_FILES.page,
  )
  const hasRoute = entries.some(
    (e) => e.isFile() && e.name === ROUTE_FILES.route,
  )

  if (hasPage) {
    const route = buildRouteDef(baseDir, currentDir, parentSegments, false)
    routes.push(route)
  } else if (hasRoute) {
    // Resource route: route.ts without page.tsx → API endpoint
    const route = buildRouteDef(baseDir, currentDir, parentSegments, true)
    routes.push(route)
  }

  // Recurse into subdirectories
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    // Skip hidden dirs and special dirs
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue

    const childDir = path.join(currentDir, entry.name)
    const segment = entry.name

    // Route groups: (groupName) — no URL segment
    if (isRouteGroup(segment)) {
      walkDir(baseDir, childDir, parentSegments, routes)
    } else {
      walkDir(baseDir, childDir, [...parentSegments, segment], routes)
    }
  }
}

function buildRouteDef(
  baseDir: string,
  dir: string,
  segments: string[],
  isResource: boolean,
): RouteDef {
  const urlPath = '/' + segments.map(segmentToUrlPart).join('/')
  const { pattern, paramNames } = buildPattern(segments)

  const filePath = (name: string) => {
    const p = path.join(dir, name)
    return fs.existsSync(p) ? p : undefined
  }

  const isDynamic = segments.some(
    (s) => isDynamicSegment(s) || isCatchAllSegment(s),
  )
  const isCatchAll = segments.some((s) => isCatchAllSegment(s))

  if (isResource) {
    // Resource route: route.ts only, no component/layout/loading/error/head
    return {
      path: urlPath,
      pattern,
      paramNames,
      segments,
      componentPath: path.join(dir, ROUTE_FILES.route),
      layoutPaths: [],
      headPaths: [],
      loaderPath: path.join(dir, ROUTE_FILES.route),
      isDynamic,
      isCatchAll,
      isResource: true,
    }
  }

  // Collect layout and head paths from root down to current dir
  const layoutPaths = collectLayouts(baseDir, dir)
  const headPaths = collectHeads(baseDir, dir)

  return {
    path: urlPath,
    pattern,
    paramNames,
    segments,
    componentPath: path.join(dir, ROUTE_FILES.page),
    layoutPaths,
    headPath: filePath(ROUTE_FILES.head),
    headPaths,
    loaderPath: filePath(ROUTE_FILES.loader),
    isDynamic,
    isCatchAll,
    isResource: false,
  }
}

/**
 * Walk from baseDir to dir, collecting layout.tsx files along the way.
 * This gives us the nested layout chain for any route.
 */
function collectLayouts(baseDir: string, dir: string): string[] {
  const layouts: string[] = []
  let current = baseDir

  // Always check baseDir itself
  const rootLayout = path.join(baseDir, ROUTE_FILES.layout)
  if (fs.existsSync(rootLayout)) {
    layouts.push(rootLayout)
  }

  // Walk from baseDir to dir, checking each intermediate directory
  const relative = path.relative(baseDir, dir)
  if (relative) {
    const parts = relative.split(path.sep)
    for (const part of parts) {
      current = path.join(current, part)
      if (current === baseDir) continue
      const layoutPath = path.join(current, ROUTE_FILES.layout)
      if (fs.existsSync(layoutPath)) {
        layouts.push(layoutPath)
      }
    }
  }

  return layouts
}

/**
 * Walk from baseDir to dir, collecting head.tsx files along the way.
 * This gives us the nested head chain for any route (similar to layouts).
 */
function collectHeads(baseDir: string, dir: string): string[] {
  const heads: string[] = []
  let current = baseDir

  // Always check baseDir itself
  const rootHead = path.join(baseDir, ROUTE_FILES.head)
  if (fs.existsSync(rootHead)) {
    heads.push(rootHead)
  }

  // Walk from baseDir to dir, checking each intermediate directory
  const relative = path.relative(baseDir, dir)
  if (relative) {
    const parts = relative.split(path.sep)
    for (const part of parts) {
      current = path.join(current, part)
      if (current === baseDir) continue
      const headPath = path.join(current, ROUTE_FILES.head)
      if (fs.existsSync(headPath)) {
        heads.push(headPath)
      }
    }
  }

  return heads
}

/**
 * Find not-found.tsx at the app root level.
 */
export function findNotFound(appDir: string): string | undefined {
  const p = path.join(appDir, ROUTE_FILES.notFound)
  return fs.existsSync(p) ? p : undefined
}

/** Convert a directory segment to a URL part */
function segmentToUrlPart(segment: string): string {
  if (isCatchAllSegment(segment)) {
    // [...slug] → :slug*
    const name = segment.slice(4, -1) // remove [... and ]
    return `:${name}*`
  }
  if (isOptionalCatchAllSegment(segment)) {
    // [[...slug]] → :slug*?
    const name = segment.slice(5, -2) // remove [[... and ]]
    return `:${name}*`
  }
  if (isDynamicSegment(segment)) {
    // [slug] → :slug
    const name = segment.slice(1, -1)
    return `:${name}`
  }
  return segment
}

/** Build a regex pattern and param name list from route segments */
function buildPattern(segments: string[]): {
  pattern: RegExp
  paramNames: string[]
} {
  const paramNames: string[] = []

  if (segments.length === 0) {
    return { pattern: /^\/$/, paramNames: [] }
  }

  const patternParts = segments.map((segment) => {
    if (isCatchAllSegment(segment)) {
      const name = segment.slice(4, -1)
      paramNames.push(name)
      return '(.+)'
    }
    if (isOptionalCatchAllSegment(segment)) {
      const name = segment.slice(5, -2)
      paramNames.push(name)
      return '(.*)'
    }
    if (isDynamicSegment(segment)) {
      const name = segment.slice(1, -1)
      paramNames.push(name)
      return '([^/]+)'
    }
    return escapeRegex(segment)
  })

  const patternStr = '^/' + patternParts.join('/') + '/?$'
  return { pattern: new RegExp(patternStr), paramNames }
}

function isDynamicSegment(segment: string): boolean {
  return (
    segment.startsWith('[') &&
    segment.endsWith(']') &&
    !segment.startsWith('[...')
  )
}

function isCatchAllSegment(segment: string): boolean {
  return segment.startsWith('[...') && segment.endsWith(']')
}

function isOptionalCatchAllSegment(segment: string): boolean {
  return segment.startsWith('[[...') && segment.endsWith(']]')
}

function isRouteGroup(segment: string): boolean {
  return segment.startsWith('(') && segment.endsWith(')')
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
