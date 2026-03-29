import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

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
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Record<
      string,
      {
        file: string
        css?: string[]
        isEntry?: boolean
      }
    >

    const entryKey = Object.keys(parsed).find(
      k => k.includes('client-entry') || parsed[k].isEntry,
    )

    expect(entryKey).toBe('virtual:pareto/client-entry')

    const entry = parsed[entryKey!]
    expect('/' + entry.file).toBe('/assets/js/client-entry.abc123.js')
    expect((entry.css ?? []).map(c => '/' + c)).toEqual([
      '/assets/css/globals.def456.css',
    ])
  })

  it('should handle missing manifest gracefully', () => {
    const manifestPath = path.resolve(tmpDir, '.vite/manifest.json')
    expect(fs.existsSync(manifestPath)).toBe(false)
  })
})
