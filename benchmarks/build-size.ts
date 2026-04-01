import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { frameworks } from './scenarios.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface SizeEntry {
  file: string
  size: number
  gzip: number
}

interface FrameworkSize {
  framework: string
  clientJS: SizeEntry[]
  clientCSS: SizeEntry[]
  serverBundle: SizeEntry[]
  totalClientJS: number
  totalClientCSS: number
  totalServer: number
  totalClientJSGzip: number
  totalClientCSSGzip: number
  totalServerGzip: number
}

const buildOutputDirs: Record<string, { client: string; server: string }> = {
  pareto: {
    client: 'pareto/.pareto/client',
    server: 'pareto/.pareto/server',
  },
  nextjs: {
    client: 'nextjs/.next/static',
    server: 'nextjs/.next/server',
  },
  remix: {
    client: 'remix/build/client',
    server: 'remix/build/server',
  },
  tanstack: {
    client: 'tanstack/.output/public',
    server: 'tanstack/.output/server',
  },
}

function getGzipSize(filePath: string): number {
  try {
    const result = execSync(`gzip -c "${filePath}" | wc -c`, {
      encoding: 'utf-8',
    }).trim()
    return parseInt(result, 10)
  } catch {
    return 0
  }
}

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath)
      }
    }
  }
  walk(dir)
  return results
}

function measureDir(baseDir: string, extensions: string[]): SizeEntry[] {
  const files = walkDir(baseDir, extensions)
  return files
    .map(file => {
      const stat = fs.statSync(file)
      return {
        file: path.relative(baseDir, file),
        size: stat.size,
        gzip: getGzipSize(file),
      }
    })
    .sort((a, b) => b.size - a.size)
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

function pad(
  str: string,
  len: number,
  align: 'left' | 'right' = 'left',
): string {
  if (align === 'right') return str.padStart(len)
  return str.padEnd(len)
}

function main() {
  const skipBuild = process.argv.includes('--skip-build')
  const showFiles = process.argv.includes('--files')

  if (!skipBuild) {
    console.log('Building all frameworks...\n')
    for (const fw of frameworks) {
      const cwd = path.resolve(__dirname, fw.dir)
      console.log(`  Building ${fw.name}...`)
      try {
        execSync(fw.buildCmd, {
          cwd,
          stdio: 'pipe',
          env: { ...process.env, NODE_ENV: 'production' },
        })
        console.log(`  ${fw.name} build complete`)
      } catch (err) {
        console.error(`  ${fw.name} build failed:`, (err as Error).message)
      }
    }
    console.log()
  }

  console.log('═'.repeat(70))
  console.log('  Build Artifact Size Comparison')
  console.log('═'.repeat(70))

  const allSizes: FrameworkSize[] = []

  for (const fw of frameworks) {
    const dirs = buildOutputDirs[fw.dir]
    if (!dirs) {
      console.log(`  Skipping ${fw.name}: no output dir config`)
      continue
    }

    const clientDir = path.resolve(__dirname, dirs.client)
    const serverDir = path.resolve(__dirname, dirs.server)

    const clientJS = measureDir(clientDir, ['.js', '.mjs'])
    const clientCSS = measureDir(clientDir, ['.css'])
    const serverBundle = measureDir(serverDir, ['.js', '.mjs', '.cjs'])

    const entry: FrameworkSize = {
      framework: fw.name,
      clientJS,
      clientCSS,
      serverBundle,
      totalClientJS: clientJS.reduce((sum, f) => sum + f.size, 0),
      totalClientCSS: clientCSS.reduce((sum, f) => sum + f.size, 0),
      totalServer: serverBundle.reduce((sum, f) => sum + f.size, 0),
      totalClientJSGzip: clientJS.reduce((sum, f) => sum + f.gzip, 0),
      totalClientCSSGzip: clientCSS.reduce((sum, f) => sum + f.gzip, 0),
      totalServerGzip: serverBundle.reduce((sum, f) => sum + f.gzip, 0),
    }
    allSizes.push(entry)
  }

  // Summary table
  const colWidth = 16
  console.log('\n  Client JavaScript (sent to browser)')
  console.log()
  console.log(
    '  ' +
      pad('Framework', 16) +
      pad('Raw', colWidth, 'right') +
      pad('Gzip', colWidth, 'right') +
      pad('Files', 8, 'right'),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * 2 + 8))

  for (const s of allSizes) {
    console.log(
      '  ' +
        pad(s.framework, 16) +
        pad(fmtBytes(s.totalClientJS), colWidth, 'right') +
        pad(fmtBytes(s.totalClientJSGzip), colWidth, 'right') +
        pad(String(s.clientJS.length), 8, 'right'),
    )
  }

  if (allSizes.some(s => s.totalClientCSS > 0)) {
    console.log('\n  Client CSS')
    console.log()
    console.log(
      '  ' +
        pad('Framework', 16) +
        pad('Raw', colWidth, 'right') +
        pad('Gzip', colWidth, 'right') +
        pad('Files', 8, 'right'),
    )
    console.log('  ' + '─'.repeat(16 + colWidth * 2 + 8))

    for (const s of allSizes) {
      console.log(
        '  ' +
          pad(s.framework, 16) +
          pad(fmtBytes(s.totalClientCSS), colWidth, 'right') +
          pad(fmtBytes(s.totalClientCSSGzip), colWidth, 'right') +
          pad(String(s.clientCSS.length), 8, 'right'),
      )
    }
  }

  console.log('\n  Server Bundle')
  console.log()
  console.log(
    '  ' +
      pad('Framework', 16) +
      pad('Raw', colWidth, 'right') +
      pad('Gzip', colWidth, 'right') +
      pad('Files', 8, 'right'),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * 2 + 8))

  for (const s of allSizes) {
    console.log(
      '  ' +
        pad(s.framework, 16) +
        pad(fmtBytes(s.totalServer), colWidth, 'right') +
        pad(fmtBytes(s.totalServerGzip), colWidth, 'right') +
        pad(String(s.serverBundle.length), 8, 'right'),
    )
  }

  console.log('\n  Total (Client JS + CSS + Server)')
  console.log()
  console.log(
    '  ' +
      pad('Framework', 16) +
      pad('Raw Total', colWidth, 'right') +
      pad('Gzip Total', colWidth, 'right'),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * 2))

  for (const s of allSizes) {
    const totalRaw = s.totalClientJS + s.totalClientCSS + s.totalServer
    const totalGzip =
      s.totalClientJSGzip + s.totalClientCSSGzip + s.totalServerGzip
    console.log(
      '  ' +
        pad(s.framework, 16) +
        pad(fmtBytes(totalRaw), colWidth, 'right') +
        pad(fmtBytes(totalGzip), colWidth, 'right'),
    )
  }

  // Per-file breakdown
  if (showFiles) {
    for (const s of allSizes) {
      console.log(`\n  ${s.framework} — Top Client JS Files`)
      console.log()
      const topFiles = s.clientJS.slice(0, 10)
      for (const f of topFiles) {
        console.log(
          `    ${pad(fmtBytes(f.size), 10, 'right')}  ${pad(fmtBytes(f.gzip), 10, 'right')} gzip  ${f.file}`,
        )
      }
      if (s.clientJS.length > 10) {
        console.log(`    ... and ${s.clientJS.length - 10} more files`)
      }
    }
  }

  console.log('\n' + '═'.repeat(70))
  console.log('  Use --files to see per-file breakdown')
  console.log('  Use --skip-build to skip the build step')
  console.log()
}

main()
