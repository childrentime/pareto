import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { loadConfig, resolveAppDir, resolveOutDir } from '../config/load'
import { defaultConfig } from '../config/defaults'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-config-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

describe('defaultConfig', () => {
  it('should have correct defaults', () => {
    expect(defaultConfig.appDir).toBe('app')
    expect(defaultConfig.outDir).toBe('.pareto')
    expect(typeof defaultConfig.configureVite).toBe('function')
  })

  it('configureVite should pass through config by default', () => {
    const config = { mode: 'development' } as any
    expect(defaultConfig.configureVite(config, { isServer: false })).toBe(config)
  })
})

describe('loadConfig', () => {
  it('should return defaults when no config file exists', async () => {
    const config = await loadConfig(tmpDir)
    expect(config.appDir).toBe('app')
    expect(config.outDir).toBe('.pareto')
  })

  it('should load pareto.config.js', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'pareto.config.js'),
      'module.exports = { appDir: "pages", outDir: "build" }',
    )
    const config = await loadConfig(tmpDir)
    expect(config.appDir).toBe('pages')
    expect(config.outDir).toBe('build')
  })
})

describe('resolveAppDir / resolveOutDir', () => {
  it('should resolve relative to cwd', () => {
    const config = { ...defaultConfig }
    expect(resolveAppDir(config, '/my/project')).toBe('/my/project/app')
    expect(resolveOutDir(config, '/my/project')).toBe('/my/project/.pareto')
  })
})
