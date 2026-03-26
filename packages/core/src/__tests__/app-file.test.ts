import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { findAppFile } from '../config/app'

let tmpDir: string

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pareto-app-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

describe('findAppFile', () => {
  it('should return undefined when no app file exists', () => {
    expect(findAppFile(tmpDir)).toBeUndefined()
  })

  it('should find app.ts', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.ts'), 'export default {}')
    const result = findAppFile(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('app.ts')
  })

  it('should find app.js', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'module.exports = {}')
    const result = findAppFile(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('app.js')
  })

  it('should find app.mjs', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.mjs'), 'export default {}')
    const result = findAppFile(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('app.mjs')
  })

  it('should find app.mts', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.mts'), 'export default {}')
    const result = findAppFile(tmpDir)
    expect(result).toBeTruthy()
    expect(result).toContain('app.mts')
  })

  it('should prefer app.ts over app.js', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.ts'), 'export default {}')
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'module.exports = {}')
    const result = findAppFile(tmpDir)
    expect(result).toContain('app.ts')
  })

  it('should return absolute path', () => {
    fs.writeFileSync(path.join(tmpDir, 'app.ts'), 'export default {}')
    const result = findAppFile(tmpDir)
    expect(path.isAbsolute(result!)).toBe(true)
  })
})
