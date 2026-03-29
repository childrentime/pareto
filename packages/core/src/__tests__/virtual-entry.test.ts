import { describe, expect, it } from 'vitest'
import {
  generateServerEntry,
  generateUnifiedClientEntry,
} from '../entry/generate'
import type { RouteDef } from '../types'

const mockRoute: RouteDef = {
  path: '/',
  pattern: /^\/$/,
  paramNames: [],
  segments: [],
  componentPath: '/app/page.tsx',
  layoutPaths: ['/app/layout.tsx'],
  headPaths: [],
  isDynamic: false,
  isCatchAll: false,
  isResource: false,
}

const mockDynamicRoute: RouteDef = {
  path: '/blog/:slug',
  pattern: /^\/blog\/([^/]+)$/,
  paramNames: ['slug'],
  segments: ['blog', ':slug'],
  componentPath: '/app/blog/[slug]/page.tsx',
  layoutPaths: ['/app/layout.tsx'],
  headPaths: [],
  loaderPath: '/app/blog/[slug]/loader.ts',
  isDynamic: true,
  isCatchAll: false,
  isResource: false,
}

describe('generateServerEntry (refactored)', () => {
  it('generates server entry with clientEntryUrls', () => {
    const code = generateServerEntry({
      routes: [mockRoute],
      clientEntryUrls: ['/@vite/client', '/virtual:pareto/client-entry'],
    })

    expect(code).toContain(
      "import { createRequestHandler } from '@paretojs/core/node'",
    )
    expect(code).toContain("import * as mod_0 from '/app/page.tsx'")
    expect(code).toContain("import * as mod_1 from '/app/layout.tsx'")
    expect(code).toContain('moduleMap')
    expect(code).toContain(
      'clientEntry: ["/@vite/client","/virtual:pareto/client-entry"]',
    )
  })

  it('generates server entry with empty clientEntryUrls for build mode', () => {
    const code = generateServerEntry({
      routes: [mockRoute],
    })

    expect(code).toContain('clientEntry: []')
  })

  it('includes global CSS imports and URLs', () => {
    const code = generateServerEntry({
      routes: [mockRoute],
      globalCssPaths: ['/app/globals.css'],
      cssUrls: ['/app/globals.css'],
    })

    expect(code).toContain("import '/app/globals.css'")
    expect(code).toContain('cssUrls: ["/app/globals.css"]')
  })

  it('handles routes with loaders and dynamic params', () => {
    const code = generateServerEntry({
      routes: [mockRoute, mockDynamicRoute],
    })

    expect(code).toContain("import * as mod_2 from '/app/blog/[slug]/page.tsx'")
    expect(code).toContain(
      "import * as mod_3 from '/app/blog/[slug]/loader.ts'",
    )
    expect(code).toContain("path: '/blog/:slug'")
    expect(code).toContain('paramNames: ["slug"]')
    expect(code).toContain('isDynamic: true')
  })

  it('deduplicates shared module imports', () => {
    // Both routes share the same layout — should only be imported once
    const code = generateServerEntry({
      routes: [mockRoute, mockDynamicRoute],
    })

    const layoutImports = code.match(
      /import \* as mod_\d+ from '\/app\/layout\.tsx'/g,
    )
    expect(layoutImports).toHaveLength(1)
  })
})

describe('generateUnifiedClientEntry', () => {
  it('generates client entry with lazy page imports', () => {
    const code = generateUnifiedClientEntry([mockRoute])

    expect(code).toContain(
      "import { startClient } from '@paretojs/core/client'",
    )
    expect(code).toContain("const page_0 = () => import('/app/page.tsx')")
    expect(code).toContain('startClient(routes)')
  })

  it('eagerly imports shared layouts', () => {
    const code = generateUnifiedClientEntry([mockRoute, mockDynamicRoute])

    expect(code).toContain("import Layout_0 from '/app/layout.tsx'")
    // Layout should only be imported once (deduplication)
    const layoutImports = code.match(
      /import Layout_\d+ from '\/app\/layout\.tsx'/g,
    )
    expect(layoutImports).toHaveLength(1)
  })

  it('includes global CSS imports', () => {
    const code = generateUnifiedClientEntry([mockRoute], ['/app/globals.css'])

    expect(code).toContain("import '/app/globals.css'")
  })

  it('marks routes with hasLoader correctly', () => {
    const code = generateUnifiedClientEntry([mockRoute, mockDynamicRoute])

    expect(code).toContain('hasLoader: false')
    expect(code).toContain('hasLoader: true')
  })

  it('skips resource routes in client entry', () => {
    const resourceRoute: RouteDef = {
      path: '/api/data',
      pattern: /^\/api\/data\/?$/,
      paramNames: [],
      segments: ['api', 'data'],
      componentPath: '/app/api/data/route.ts',
      layoutPaths: [],
      headPaths: [],
      isDynamic: false,
      isCatchAll: false,
      isResource: true,
    }
    const code = generateUnifiedClientEntry([mockRoute, resourceRoute])

    expect(code).not.toContain("'/api/data'")
    expect(code).not.toContain('route.ts')
  })

  it('includes notFoundComponent when notFoundPath is provided', () => {
    const code = generateUnifiedClientEntry(
      [mockRoute],
      [],
      '/app/not-found.tsx',
    )

    expect(code).toContain("import NotFoundComponent from '/app/not-found.tsx'")
    expect(code).toContain('notFoundComponent: NotFoundComponent')
  })
})

describe('generateServerEntry with headPaths', () => {
  it('includes headPaths in route definitions', () => {
    const routeWithHeads: RouteDef = {
      ...mockRoute,
      headPath: '/app/head.tsx',
      headPaths: ['/app/head.tsx'],
    }
    const code = generateServerEntry({ routes: [routeWithHeads] })

    // head.tsx should be imported (mod index may vary based on registration order)
    expect(code).toContain("from '/app/head.tsx'")
    expect(code).toContain('headPaths:')
    expect(code).toContain('/app/head.tsx')
  })

  it('registers all headPaths modules in moduleMap', () => {
    const routeWithMultipleHeads: RouteDef = {
      ...mockDynamicRoute,
      headPath: '/app/blog/[slug]/head.tsx',
      headPaths: ['/app/head.tsx', '/app/blog/[slug]/head.tsx'],
    }
    const code = generateServerEntry({ routes: [routeWithMultipleHeads] })

    expect(code).toContain("from '/app/head.tsx'")
    expect(code).toContain("from '/app/blog/[slug]/head.tsx'")
    // Both should be in the module map
    expect(code).toContain("'/app/head.tsx':")
    expect(code).toContain("'/app/blog/[slug]/head.tsx':")
  })

  it('includes notFoundPath in createRequestHandler when provided', () => {
    const code = generateServerEntry({
      routes: [mockRoute],
      notFoundPath: '/app/not-found.tsx',
    })

    expect(code).toContain("from '/app/not-found.tsx'")
    expect(code).toContain("notFoundPath: '/app/not-found.tsx'")
  })

  it('includes isResource flag in route definitions', () => {
    const resourceRoute: RouteDef = {
      path: '/api/users',
      pattern: /^\/api\/users\/?$/,
      paramNames: [],
      segments: ['api', 'users'],
      componentPath: '/app/api/users/route.ts',
      layoutPaths: [],
      headPaths: [],
      loaderPath: '/app/api/users/route.ts',
      isDynamic: false,
      isCatchAll: false,
      isResource: true,
    }
    const code = generateServerEntry({ routes: [resourceRoute] })

    expect(code).toContain('isResource: true')
  })
})
