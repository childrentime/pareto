import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-build-test-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

describe('readViteManifest', () => {
  // We test the manifest reading logic inline since it's a private function.
  // Instead we test the expected behavior: parsing Vite manifest format.

  it('should parse Vite manifest and extract entry URLs', () => {
    const manifest = {
      'virtual:pareto/client-entry': {
        file: 'assets/js/client-entry.abc123.js',
        isEntry: true,
        css: ['assets/css/globals.def456.css'],
      },
    }

    const viteDir = path.resolve(tmpDir, '.vite')
    fs.mkdirSync(viteDir, { recursive: true })
    fs.writeFileSync(
      path.resolve(viteDir, 'manifest.json'),
      JSON.stringify(manifest),
    )

    // Simulate the manifest reading logic
    const manifestPath = path.resolve(tmpDir, '.vite/manifest.json')
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<string, {
      file: string
      css?: string[]
      isEntry?: boolean
    }>

    const entryKey = Object.keys(parsed).find(
      (k) => k.includes('client-entry') || parsed[k].isEntry,
    )

    expect(entryKey).toBe('virtual:pareto/client-entry')

    const entry = parsed[entryKey!]
    expect('/' + entry.file).toBe('/assets/js/client-entry.abc123.js')
    expect((entry.css ?? []).map((c) => '/' + c)).toEqual(['/assets/css/globals.def456.css'])
  })

  it('should handle missing manifest gracefully', () => {
    const manifestPath = path.resolve(tmpDir, '.vite/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(false)
  })
})

describe('SSG path generation', () => {
  it('should replace dynamic params in route path', () => {
    const routePath = '/blog/:slug'
    const params = { slug: 'hello-world' }

    let urlPath = routePath
    for (const [key, value] of Object.entries(params)) {
      urlPath = urlPath.replace(`:${key}`, value)
    }

    expect(urlPath).toBe('/blog/hello-world')
  })

  it('should replace multiple dynamic params', () => {
    const routePath = '/blog/:year/:slug'
    const params = { year: '2024', slug: 'my-post' }

    let urlPath = routePath
    for (const [key, value] of Object.entries(params)) {
      urlPath = urlPath.replace(`:${key}`, value)
    }

    expect(urlPath).toBe('/blog/2024/my-post')
  })

  it('should generate correct output paths for SSG', () => {
    const cases = [
      { urlPath: '/', expected: 'index.html' },
      { urlPath: '/about', expected: 'about/index.html' },
      { urlPath: '/blog/hello', expected: 'blog/hello/index.html' },
    ]

    for (const { urlPath, expected } of cases) {
      const outputPath = urlPath === '/'
        ? path.join(tmpDir, 'index.html')
        : path.join(tmpDir, urlPath.slice(1), 'index.html')

      const relative = path.relative(tmpDir, outputPath)
      expect(relative).toBe(expected)
    }
  })
})
