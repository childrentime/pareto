import path from 'path'
import fs from 'fs'
import { loadConfig, resolveOutDir } from '../config'

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

  // The production server entry handles its own graceful shutdown
  require(serverEntry)
}
