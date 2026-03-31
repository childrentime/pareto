import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { matchRoute } from '../router/route-matcher'
import { scanRoutes } from '../router/route-scanner'

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
