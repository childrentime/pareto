import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import type { Application } from 'express'

const APP_FILENAMES = [
  'app.ts',
  'app.mts',
  'app.js',
  'app.mjs',
]

/**
 * Find the user's custom app file (app.ts / app.js) in the project root.
 * Returns the file path if found, undefined otherwise.
 */
export function findAppFile(cwd: string = process.cwd()): string | undefined {
  for (const filename of APP_FILENAMES) {
    const filePath = path.resolve(cwd, filename)
    if (fs.existsSync(filePath)) return filePath
  }
  return undefined
}

/**
 * Load the user's custom Express app from app.ts / app.js.
 * Returns the Express Application if found, undefined otherwise.
 */
export async function loadApp(cwd: string = process.cwd()): Promise<Application | undefined> {
  const filePath = findAppFile(cwd)
  if (!filePath) return undefined

  try {
    const mod = await import(/* @vite-ignore */ pathToFileURL(filePath).href)
    const app = mod.default ?? mod
    if (typeof app === 'function') return app as Application
    console.warn(`[pareto] app file found but does not export an Express app: ${filePath}`)
  } catch {
    try {
      const mod = require(filePath)
      const app = mod.default ?? mod
      if (typeof app === 'function') return app as Application
    } catch {
      console.warn(`[pareto] Failed to load app file: ${filePath}`)
    }
  }
  return undefined
}
