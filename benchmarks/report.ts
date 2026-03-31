import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import type { Framework, Scenario } from './scenarios.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export interface BenchmarkResult {
  framework: string
  scenario: string
  requests: {
    total: number
    average: number
    mean: number
    stddev: number
    min: number
    max: number
  }
  latency: {
    average: number
    mean: number
    stddev: number
    min: number
    max: number
    p50: number
    p90: number
    p95: number
    p99: number
  }
  throughput: {
    average: number
    mean: number
    stddev: number
    min: number
    max: number
    total: number
  }
  duration: number
  errors: number
  timeouts: number
  non2xx: number
}

export interface BenchmarkReport {
  timestamp: string
  config: {
    duration: number
    connections: number
    pipelining: number
  }
  results: BenchmarkResult[]
  soloTtfb?: BenchmarkResult[]
  system: {
    platform: string
    arch: string
    nodeVersion: string
    cpus: number
  }
}

function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtMs(n: number): string {
  if (n < 1) return `${(n * 1000).toFixed(0)}μs`
  if (n < 1000) return `${n.toFixed(1)}ms`
  return `${(n / 1000).toFixed(2)}s`
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

export function printReport(
  results: BenchmarkResult[],
  scenarios: Scenario[],
  frameworks: Framework[],
  config: { duration: number; connections: number; pipelining: number },
  soloTtfb?: BenchmarkResult[],
): void {
  const frameworkNames = frameworks.map(f => f.name)
  const colWidth = 14

  console.log('\n')
  console.log('═'.repeat(70))
  console.log('  SSR Framework Benchmark Results')
  console.log('═'.repeat(70))
  console.log(
    `  Duration: ${config.duration}s | Connections: ${config.connections} | Pipelining: ${config.pipelining}`,
  )
  console.log(`  Node ${process.version} | ${process.platform} ${process.arch}`)
  console.log('─'.repeat(70))

  // RPS table
  console.log('\n  Requests/sec (higher is better)')
  console.log()

  const header =
    '  ' +
    pad('Scenario', 16) +
    frameworkNames.map(n => pad(n, colWidth, 'right')).join('')
  console.log(header)
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const scenario of scenarios) {
    const row = frameworkNames.map(fw => {
      const r = results.find(
        res => res.framework === fw && res.scenario === scenario.name,
      )
      if (!r) return pad('—', colWidth, 'right')
      return pad(fmtNum(r.requests.average) + '/s', colWidth, 'right')
    })
    console.log('  ' + pad(scenario.name, 16) + row.join(''))
  }

  // Latency / TTFB table
  console.log('\n  TTFB p50 / p99 (lower is better)')
  console.log()

  const latColWidth = colWidth + 4
  const latHeader =
    '  ' +
    pad('Scenario', 16) +
    frameworkNames.map(n => pad(n, latColWidth, 'right')).join('')
  console.log(latHeader)
  console.log('  ' + '─'.repeat(16 + latColWidth * frameworkNames.length))

  for (const scenario of scenarios) {
    const row = frameworkNames.map(fw => {
      const r = results.find(
        res => res.framework === fw && res.scenario === scenario.name,
      )
      if (!r) return pad('—', latColWidth, 'right')
      return pad(
        `${fmtMs(r.latency.p50)} / ${fmtMs(r.latency.p99)}`,
        latColWidth,
        'right',
      )
    })
    console.log('  ' + pad(scenario.name, 16) + row.join(''))
  }

  // Solo TTFB (1-connection)
  if (soloTtfb && soloTtfb.length > 0) {
    console.log('\n  Solo TTFB (1 connection, no contention — lower is better)')
    console.log()

    const soloColWidth = colWidth + 4
    const soloHeader =
      '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, soloColWidth, 'right')).join('')
    console.log(soloHeader)
    console.log('  ' + '─'.repeat(16 + soloColWidth * frameworkNames.length))

    for (const scenario of scenarios) {
      const row = frameworkNames.map(fw => {
        const r = soloTtfb.find(
          res => res.framework === fw && res.scenario === scenario.name,
        )
        if (!r) return pad('—', soloColWidth, 'right')
        return pad(
          `${fmtMs(r.latency.p50)} / ${fmtMs(r.latency.p99)}`,
          soloColWidth,
          'right',
        )
      })
      console.log('  ' + pad(scenario.name, 16) + row.join(''))
    }
  }

  // Throughput table
  console.log('\n  Throughput avg (higher is better)')
  console.log()

  const tpHeader =
    '  ' +
    pad('Scenario', 16) +
    frameworkNames.map(n => pad(n, colWidth, 'right')).join('')
  console.log(tpHeader)
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const scenario of scenarios) {
    const row = frameworkNames.map(fw => {
      const r = results.find(
        res => res.framework === fw && res.scenario === scenario.name,
      )
      if (!r) return pad('—', colWidth, 'right')
      return pad(fmtBytes(r.throughput.average) + '/s', colWidth, 'right')
    })
    console.log('  ' + pad(scenario.name, 16) + row.join(''))
  }

  // Errors
  const hasErrors = results.some(r => r.errors > 0 || r.non2xx > 0)
  if (hasErrors) {
    console.log('\n  Errors')
    console.log()
    for (const r of results) {
      if (r.errors > 0 || r.non2xx > 0) {
        console.log(
          `  ! ${r.framework} / ${r.scenario}: ${r.errors} errors, ${r.non2xx} non-2xx`,
        )
      }
    }
  }

  console.log('\n' + '═'.repeat(70))
  console.log()
}

export function saveReport(
  results: BenchmarkResult[],
  config: { duration: number; connections: number; pipelining: number },
  soloTtfb?: BenchmarkResult[],
): string {
  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    config,
    results,
    ...(soloTtfb ? { soloTtfb } : {}),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      cpus: os.cpus().length,
    },
  }

  const outPath = path.resolve(
    __dirname,
    `results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  )
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  return outPath
}
