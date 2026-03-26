import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import type { ParetoConfig } from '../types'
import { defaultConfig } from './defaults'

const CONFIG_FILENAMES = [
  'pareto.config.ts',
  'pareto.config.mts',
  'pareto.config.js',
  'pareto.config.mjs',
]

export async function loadConfig(cwd: string = process.cwd()): Promise<Required<ParetoConfig>> {
  for (const filename of CONFIG_FILENAMES) {
    const configPath = path.resolve(cwd, filename)
    if (fs.existsSync(configPath)) {
      // Use dynamic import — Node 22+ supports TS via --experimental-strip-types,
      // and Vite's ssrLoadModule handles TS in dev mode.
      // For .ts files, use tsx/jiti at build time or native support.
      try {
        const mod = await import(/* @vite-ignore */ pathToFileURL(configPath).href)
        const resolved = mod.default ?? mod
        return { ...defaultConfig, ...resolved } as Required<ParetoConfig>
      } catch {
        // Fallback: try require for CJS configs
        try {
          const mod = require(configPath)
          const resolved = mod.default ?? mod
          return { ...defaultConfig, ...resolved } as Required<ParetoConfig>
        } catch {
          console.warn(`[pareto] Failed to load config: ${configPath}`)
        }
      }
    }
  }
  return { ...defaultConfig }
}

export function resolveAppDir(config: Required<ParetoConfig>, cwd: string = process.cwd()): string {
  return path.resolve(cwd, config.appDir)
}

export function resolveOutDir(config: Required<ParetoConfig>, cwd: string = process.cwd()): string {
  return path.resolve(cwd, config.outDir)
}
