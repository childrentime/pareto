import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  findDocument,
  findError,
  findNotFound,
  findRootHead,
  scanRoutes,
} from '../router/route-scanner'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

function createFile(
  relativePath: string,
  content = 'export default function(){}',
) {
  const fullPath = path.join(tmpDir, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content)
}

describe('scanRoutes', () => {
  it('should find routes with page.tsx files', () => {
    createFile('home/page.tsx')
    createFile('about/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(2)

    const paths = routes.map(r => r.path)
    expect(paths).toContain('/home')
    expect(paths).toContain('/about')
  })

  it('should detect root page.tsx as /', () => {
    createFile('page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/')
  })

  it('should handle dynamic segments [param]', () => {
    createFile('blog/[slug]/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].isDynamic).toBe(true)
    expect(routes[0].isCatchAll).toBe(false)
    expect(routes[0].paramNames).toContain('slug')
  })

  it('should handle catch-all segments [...path]', () => {
    createFile('docs/[...path]/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].isDynamic).toBe(true)
    expect(routes[0].isCatchAll).toBe(true)
    expect(routes[0].paramNames).toContain('path')
  })

  it('should handle route groups (group) - no URL segment', () => {
    createFile('(marketing)/pricing/page.tsx')
    createFile('(marketing)/about/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(2)

    const paths = routes.map(r => r.path)
    expect(paths).toContain('/pricing')
    expect(paths).toContain('/about')
    // No "(marketing)" in the URL
    expect(paths.every(p => !p.includes('marketing'))).toBe(true)
  })

  it('should collect layout paths from parent directories', () => {
    createFile(
      'layout.tsx',
      'export default function Root({children}){return children}',
    )
    createFile(
      'dashboard/layout.tsx',
      'export default function DashLayout({children}){return children}',
    )
    createFile('dashboard/settings/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].layoutPaths).toHaveLength(2)
    expect(routes[0].layoutPaths[0]).toContain('layout.tsx')
    expect(routes[0].layoutPaths[1]).toContain(
      path.join('dashboard', 'layout.tsx'),
    )
  })

  it('should collect headPaths from parent directories', () => {
    createFile(
      'head.tsx',
      'export function head() { return { title: "Root" } }',
    )
    createFile(
      'blog/head.tsx',
      'export function head() { return { title: "Blog" } }',
    )
    createFile('blog/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].headPaths).toHaveLength(2)
    expect(routes[0].headPaths[0]).toContain('head.tsx')
    expect(routes[0].headPaths[1]).toContain(path.join('blog', 'head.tsx'))
  })

  it('should return empty headPaths when no head.tsx exists', () => {
    createFile('home/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes[0].headPaths).toHaveLength(0)
  })

  it('should set headPaths for co-located head.tsx', () => {
    createFile('home/page.tsx')
    createFile('home/head.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes[0].headPaths).toHaveLength(1)
    expect(routes[0].headPaths[0]).toContain('head.tsx')
  })
})

describe('findNotFound', () => {
  it('should find not-found.tsx at app root', () => {
    createFile('not-found.tsx', 'export default function NotFound() {}')
    const result = findNotFound(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('not-found.tsx')
  })

  it('should return undefined when not-found.tsx does not exist', () => {
    const result = findNotFound(tmpDir)
    expect(result).toBeUndefined()
  })
})

describe('findError', () => {
  it('should find error.tsx at app root', () => {
    createFile('error.tsx', 'export default function ErrorPage({ error }) {}')
    const result = findError(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('error.tsx')
  })

  it('should return undefined when error.tsx does not exist', () => {
    const result = findError(tmpDir)
    expect(result).toBeUndefined()
  })
})

describe('findRootHead', () => {
  it('should find head.tsx at app root', () => {
    createFile('head.tsx', 'export default function Head() { return null }')
    const result = findRootHead(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('head.tsx')
  })

  it('should return undefined when head.tsx does not exist', () => {
    const result = findRootHead(tmpDir)
    expect(result).toBeUndefined()
  })
})

describe('findDocument', () => {
  it('should find document.tsx at app root', () => {
    createFile(
      'document.tsx',
      'export function getDocumentProps() { return { lang: "en" } }',
    )
    const result = findDocument(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('document.tsx')
  })

  it('should return undefined when document.tsx does not exist', () => {
    const result = findDocument(tmpDir)
    expect(result).toBeUndefined()
  })
})

describe('route sorting and resource routes', () => {
  it('should sort: static first, dynamic second, catch-all last', () => {
    createFile('about/page.tsx')
    createFile('[id]/page.tsx')
    createFile('[...catch]/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes[0].path).toBe('/about')
    expect(routes[1].isDynamic).toBe(true)
    expect(routes[1].isCatchAll).toBe(false)
    expect(routes[2].isCatchAll).toBe(true)
  })

  it('should detect resource routes (route.ts without page.tsx)', () => {
    createFile('api/users/route.ts', 'export function loader() { return [] }')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/api/users')
    expect(routes[0].isResource).toBe(true)
  })

  it('should prefer page.tsx over route.ts', () => {
    createFile('home/page.tsx')
    createFile('home/route.ts')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].isResource).toBe(false)
  })

  it('should set isResource=false for normal routes', () => {
    createFile('home/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes[0].isResource).toBe(false)
  })

  it('should not include actionPath on page routes', () => {
    createFile('home/page.tsx')
    // Even if action.ts exists, it should be ignored
    createFile('home/action.ts', 'export function action() {}')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0]).not.toHaveProperty('actionPath')
  })

  it('should not include actionPath on resource routes', () => {
    createFile('api/users/route.ts', 'export function loader() {}')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0]).not.toHaveProperty('actionPath')
  })

  it('should handle optional catch-all segments [[...slug]]', () => {
    createFile('docs/[[...slug]]/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].isDynamic).toBe(true)
    expect(routes[0].isCatchAll).toBe(false)
    expect(routes[0].paramNames).toContain('slug')
    expect(routes[0].path).toContain(':slug*')
    expect(routes[0].pattern.test('/docs/')).toBe(true)
    expect(routes[0].pattern.test('/docs/a/b/c')).toBe(true)
  })

  it('should skip hidden directories and node_modules', () => {
    createFile('.hidden/page.tsx')
    createFile('node_modules/something/page.tsx')
    createFile('visible/page.tsx')

    const routes = scanRoutes(tmpDir)
    expect(routes).toHaveLength(1)
    expect(routes[0].path).toBe('/visible')
  })
})
