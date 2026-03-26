import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { scanRoutes } from '../router/route-scanner'
import { matchRoute, diffLayouts } from '../router/route-matcher'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-match-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

function createFile(relativePath: string) {
  const fullPath = path.join(tmpDir, relativePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, 'export default function(){}')
}

describe('matchRoute', () => {
  it('should match static routes', () => {
    createFile('home/page.tsx')
    createFile('about/page.tsx')
    const routes = scanRoutes(tmpDir)

    const match = matchRoute('/home', routes)
    expect(match).not.toBeNull()
    expect(match!.route.path).toBe('/home')
    expect(match!.params).toEqual({})
  })

  it('should match dynamic routes and extract params', () => {
    createFile('blog/[slug]/page.tsx')
    const routes = scanRoutes(tmpDir)

    const match = matchRoute('/blog/hello-world', routes)
    expect(match).not.toBeNull()
    expect(match!.params.slug).toBe('hello-world')
  })

  it('should match catch-all routes', () => {
    createFile('docs/[...path]/page.tsx')
    const routes = scanRoutes(tmpDir)

    const match = matchRoute('/docs/getting-started/install', routes)
    expect(match).not.toBeNull()
    expect(match!.params.path).toBe('getting-started/install')
  })

  it('should prefer static over dynamic routes', () => {
    createFile('blog/featured/page.tsx')
    createFile('blog/[slug]/page.tsx')
    const routes = scanRoutes(tmpDir)

    const staticMatch = matchRoute('/blog/featured', routes)
    expect(staticMatch).not.toBeNull()
    expect(staticMatch!.route.isDynamic).toBe(false)

    const dynamicMatch = matchRoute('/blog/other', routes)
    expect(dynamicMatch).not.toBeNull()
    expect(dynamicMatch!.route.isDynamic).toBe(true)
  })

  it('should return null for unmatched routes', () => {
    createFile('home/page.tsx')
    const routes = scanRoutes(tmpDir)

    expect(matchRoute('/nonexistent', routes)).toBeNull()
  })

  it('should handle trailing slash normalization', () => {
    createFile('about/page.tsx')
    const routes = scanRoutes(tmpDir)

    expect(matchRoute('/about/', routes)).not.toBeNull()
    expect(matchRoute('/about', routes)).not.toBeNull()
  })

  it('should decode URI components in params', () => {
    createFile('user/[name]/page.tsx')
    const routes = scanRoutes(tmpDir)

    const match = matchRoute('/user/john%20doe', routes)
    expect(match!.params.name).toBe('john doe')
  })
})

describe('diffLayouts', () => {
  it('should return all layouts as changed when from is null', () => {
    createFile('layout.tsx')
    createFile('dashboard/layout.tsx')
    createFile('dashboard/settings/page.tsx')
    const routes = scanRoutes(tmpDir)
    const match = matchRoute('/dashboard/settings', routes)!

    const diff = diffLayouts(null, match)
    expect(diff.shared).toEqual([])
    expect(diff.changed).toEqual(match.route.layoutPaths)
  })

  it('should detect shared layouts between routes', () => {
    createFile('layout.tsx')
    createFile('dashboard/layout.tsx')
    createFile('dashboard/settings/page.tsx')
    createFile('dashboard/profile/page.tsx')
    const routes = scanRoutes(tmpDir)

    const from = matchRoute('/dashboard/settings', routes)!
    const to = matchRoute('/dashboard/profile', routes)!

    const diff = diffLayouts(from, to)
    // Root layout and dashboard layout are shared
    expect(diff.shared.length).toBe(2)
    expect(diff.changed.length).toBe(0)
  })
})
