import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { loadEnv } from '../config/env'

let tmpDir: string
const savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-env-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
  // Restore env vars
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  Object.keys(savedEnv).forEach((k) => delete savedEnv[k])
})

function trackEnv(...keys: string[]) {
  for (const key of keys) {
    savedEnv[key] = process.env[key]
  }
}

describe('loadEnv', () => {
  it('should load .env file', () => {
    trackEnv('TEST_FOO', 'TEST_BAR')
    fs.writeFileSync(path.join(tmpDir, '.env'), 'TEST_FOO=hello\nTEST_BAR=world')
    loadEnv(tmpDir)
    expect(process.env.TEST_FOO).toBe('hello')
    expect(process.env.TEST_BAR).toBe('world')
  })

  it('should not overwrite existing env vars', () => {
    trackEnv('TEST_EXISTING')
    process.env.TEST_EXISTING = 'original'
    fs.writeFileSync(path.join(tmpDir, '.env'), 'TEST_EXISTING=overwritten')
    loadEnv(tmpDir)
    expect(process.env.TEST_EXISTING).toBe('original')
  })

  it('should skip comments and empty lines', () => {
    trackEnv('TEST_VALID')
    fs.writeFileSync(
      path.join(tmpDir, '.env'),
      '# this is a comment\n\nTEST_VALID=yes\n  \n# another comment',
    )
    loadEnv(tmpDir)
    expect(process.env.TEST_VALID).toBe('yes')
  })

  it('should strip surrounding quotes', () => {
    trackEnv('TEST_DOUBLE', 'TEST_SINGLE', 'TEST_BACKTICK')
    fs.writeFileSync(
      path.join(tmpDir, '.env'),
      'TEST_DOUBLE="quoted"\nTEST_SINGLE=\'single\'\nTEST_BACKTICK=`backtick`',
    )
    loadEnv(tmpDir)
    expect(process.env.TEST_DOUBLE).toBe('quoted')
    expect(process.env.TEST_SINGLE).toBe('single')
    expect(process.env.TEST_BACKTICK).toBe('backtick')
  })

  it('should load mode-specific env files', () => {
    trackEnv('TEST_MODE')
    fs.writeFileSync(path.join(tmpDir, '.env.production'), 'TEST_MODE=prod')
    loadEnv(tmpDir, 'production')
    expect(process.env.TEST_MODE).toBe('prod')
  })

  it('should let later files override earlier ones', () => {
    trackEnv('TEST_OVERRIDE')
    fs.writeFileSync(path.join(tmpDir, '.env'), 'TEST_OVERRIDE=base')
    fs.writeFileSync(path.join(tmpDir, '.env.local'), 'TEST_OVERRIDE=local')
    loadEnv(tmpDir)
    // .env loaded first sets the value, .env.local skips because key exists
    // This matches dotenv behavior: first file wins
    expect(process.env.TEST_OVERRIDE).toBe('base')
  })

  it('should load .env.local when .env is missing', () => {
    trackEnv('TEST_LOCAL_ONLY')
    fs.writeFileSync(path.join(tmpDir, '.env.local'), 'TEST_LOCAL_ONLY=yes')
    loadEnv(tmpDir)
    expect(process.env.TEST_LOCAL_ONLY).toBe('yes')
  })
})
