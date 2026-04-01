import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../../..')
const DOCS_SRC = path.join(ROOT, 'website/src/content/docs')
const DOCS_DEST = path.resolve(__dirname, '../docs')

const CATEGORIES = ['guides', 'concepts', 'api']

// Clean and recreate
if (fs.existsSync(DOCS_DEST)) {
  fs.rmSync(DOCS_DEST, { recursive: true })
}

let count = 0

for (const category of CATEGORIES) {
  const srcDir = path.join(DOCS_SRC, category)
  if (!fs.existsSync(srcDir)) continue

  const destDir = path.join(DOCS_DEST, category)
  fs.mkdirSync(destDir, { recursive: true })

  for (const file of fs.readdirSync(srcDir).filter(f => f.endsWith('.md'))) {
    fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file))
    count++
  }
}

console.log(`Copied ${count} doc files to packages/core/docs/`)
