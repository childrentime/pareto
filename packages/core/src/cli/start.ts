import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'
import { loadConfig, resolveOutDir } from '../config/load'

export async function start() {
  const cwd = process.cwd()
  const config = await loadConfig(cwd)
  const outDir = resolveOutDir(config, cwd)
  const serverEntry = path.resolve(outDir, 'index.js')

  if (!fs.existsSync(serverEntry)) {
    console.error(
      `[pareto] Production build not found at ${outDir}. Run 'pareto build' first.`,
    )
    process.exit(1)
  }

  const _require = createRequire(import.meta.url ?? __filename)
  _require(serverEntry)
}
