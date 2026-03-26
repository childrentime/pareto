import fs from 'fs'
import path from 'path'

/**
 * Load environment variables from .env files.
 *
 * Loading order (later files override earlier ones):
 *   .env                — always loaded
 *   .env.local          — always loaded, gitignored
 *   .env.{mode}         — only in matching mode
 *   .env.{mode}.local   — only in matching mode, gitignored
 *
 * Variables already set in process.env are NOT overwritten.
 */
export function loadEnv(
  cwd: string = process.cwd(),
  mode: string = process.env.NODE_ENV ?? 'development',
): void {
  const files = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`,
  ]

  for (const file of files) {
    const filePath = path.resolve(cwd, file)
    if (!fs.existsSync(filePath)) continue

    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      parseEnvFile(content)
    } catch {
      // Silently skip unreadable files
    }
  }
}

/**
 * Parse .env file content and inject into process.env.
 * Supports: KEY=VALUE, quoted values, # comments, empty lines.
 * Does NOT overwrite existing env vars.
 */
function parseEnvFile(content: string): void {
  for (const line of content.split('\n')) {
    const trimmed = line.trim()

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()

    // Remove surrounding quotes (single, double, or backtick)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('`') && value.endsWith('`'))
    ) {
      value = value.slice(1, -1)
    }

    // Don't overwrite existing env vars
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
