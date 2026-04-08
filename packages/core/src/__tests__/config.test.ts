import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultConfig } from '../config/defaults'
import { loadConfig, resolveAppDir, resolveOutDir } from '../config/load'

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
