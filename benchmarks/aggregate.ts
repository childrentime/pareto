import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import type { BenchmarkReport, BenchmarkResult } from './report.js'
import { frameworks, scenarios } from './scenarios.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

interface AggregatedMetric {
  median: number
  min: number
  max: number
  values: number[]
  cv: number
}

interface AggregatedResult {
  framework: string
  scenario: string
  runs: number
  rps: AggregatedMetric
  latencyP50: AggregatedMetric
  latencyP99: AggregatedMetric
  throughput: AggregatedMetric
  errors: number
}

interface AggregatedReport {
  timestamp: string
  runs: number
  config: BenchmarkReport['config']
  system: BenchmarkReport['system']
  results: AggregatedResult[]
  soloTtfb: AggregatedResult[]
  rawFiles: string[]
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function cv(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  if (mean === 0) return 0
  const variance =
    arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1)
  return (Math.sqrt(variance) / mean) * 100
}

function aggregateMetric(values: number[]): AggregatedMetric {
  return {
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    values,
    cv: cv(values),
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

function loadReports(pattern?: string): BenchmarkReport[] {
  const dir = pattern ? path.dirname(pattern) : __dirname
  const files = fs
    .readdirSync(dir)
    .filter(f => f.startsWith('results-') && f.endsWith('.json'))
    .sort()

  const matchFiles = pattern
    ? files.filter(f =>
        f.includes(
          pattern.replace(/.*results-/, 'results-').replace('.json', ''),
        ),
      )
    : files

  const targetFiles = matchFiles.length > 0 ? matchFiles : files.slice(-3)

  return targetFiles.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8')
    return { ...JSON.parse(content), _file: f } as BenchmarkReport & {
      _file: string
    }
  })
}

function aggregateResults(
  reports: BenchmarkReport[],
  key: 'results' | 'soloTtfb',
): AggregatedResult[] {
  const frameworkNames = frameworks.map(f => f.name)
  const scenarioNames = scenarios.map(s => s.name)
  const aggregated: AggregatedResult[] = []

  for (const fw of frameworkNames) {
    for (const sc of scenarioNames) {
      const runs: BenchmarkResult[] = reports
        .map(r =>
          (r[key] ?? []).find(
            res => res.framework === fw && res.scenario === sc,
          ),
        )
        .filter((r): r is BenchmarkResult => r !== undefined)

      if (runs.length === 0) continue

      aggregated.push({
        framework: fw,
        scenario: sc,
        runs: runs.length,
        rps: aggregateMetric(runs.map(r => r.requests.average)),
        latencyP50: aggregateMetric(runs.map(r => r.latency.p50)),
        latencyP99: aggregateMetric(runs.map(r => r.latency.p99)),
        throughput: aggregateMetric(runs.map(r => r.throughput.average)),
        errors: runs.reduce((s, r) => s + r.errors, 0),
      })
    }
  }

  return aggregated
}

function printAggregatedReport(report: AggregatedReport): void {
  const frameworkNames = [...new Set(report.results.map(r => r.framework))]
  const scenarioNames = [...new Set(report.results.map(r => r.scenario))]

  console.log('\n')
  console.log('═'.repeat(78))
  console.log('  SSR Framework Benchmark — Aggregated Results')
  console.log('═'.repeat(78))
  console.log(
    `  ${report.runs} runs | ${report.config.duration}s duration | ` +
      `${report.config.connections} connections | ${report.config.pipelining} pipelining`,
  )
  console.log(
    `  Node ${report.system.nodeVersion} | ${report.system.platform} ${report.system.arch} | ${report.system.cpus} CPUs`,
  )
  console.log('─'.repeat(78))

  const colWidth = 20

  // RPS table (median with CV%)
  console.log('\n  Requests/sec — median (CV%) — higher is better')
  console.log()
  console.log(
    '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, colWidth, 'right')).join(''),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const sc of scenarioNames) {
    const row = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r) return pad('—', colWidth, 'right')
      const cvStr = r.rps.cv > 0 ? ` (${r.rps.cv.toFixed(1)}%)` : ''
      return pad(`${fmtNum(r.rps.median)}/s${cvStr}`, colWidth, 'right')
    })
    console.log('  ' + pad(sc, 16) + row.join(''))
  }

  // Latency table
  console.log('\n  Latency p50 / p99 — median — lower is better')
  console.log()
  const latColWidth = colWidth + 2
  console.log(
    '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, latColWidth, 'right')).join(''),
  )
  console.log('  ' + '─'.repeat(16 + latColWidth * frameworkNames.length))

  for (const sc of scenarioNames) {
    const row = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r) return pad('—', latColWidth, 'right')
      return pad(
        `${fmtMs(r.latencyP50.median)} / ${fmtMs(r.latencyP99.median)}`,
        latColWidth,
        'right',
      )
    })
    console.log('  ' + pad(sc, 16) + row.join(''))
  }

  // Solo TTFB
  if (report.soloTtfb.length > 0) {
    console.log('\n  Solo TTFB (1 connection) — median — lower is better')
    console.log()
    console.log(
      '  ' +
        pad('Scenario', 16) +
        frameworkNames.map(n => pad(n, latColWidth, 'right')).join(''),
    )
    console.log('  ' + '─'.repeat(16 + latColWidth * frameworkNames.length))

    for (const sc of scenarioNames) {
      const row = frameworkNames.map(fw => {
        const r = report.soloTtfb.find(
          res => res.framework === fw && res.scenario === sc,
        )
        if (!r) return pad('—', latColWidth, 'right')
        return pad(
          `${fmtMs(r.latencyP50.median)} / ${fmtMs(r.latencyP99.median)}`,
          latColWidth,
          'right',
        )
      })
      console.log('  ' + pad(sc, 16) + row.join(''))
    }
  }

  // Response size (throughput / rps)
  console.log('\n  Avg response size — lower is better')
  console.log()
  console.log(
    '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, colWidth, 'right')).join(''),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const sc of scenarioNames) {
    const row = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r || !r.rps.median) return pad('—', colWidth, 'right')
      const bytesPerReq = r.throughput.median / r.rps.median
      return pad(fmtBytes(bytesPerReq), colWidth, 'right')
    })
    console.log('  ' + pad(sc, 16) + row.join(''))
  }

  // Stability assessment
  console.log(
    '\n  Stability (CV% < 5% = stable, < 10% = acceptable, > 10% = noisy)',
  )
  console.log()
  console.log(
    '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, colWidth, 'right')).join(''),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const sc of scenarioNames) {
    const row = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r) return pad('—', colWidth, 'right')
      const pct = r.rps.cv
      const label = pct < 5 ? 'stable' : pct < 10 ? 'acceptable' : 'noisy'
      return pad(`${pct.toFixed(1)}% ${label}`, colWidth, 'right')
    })
    console.log('  ' + pad(sc, 16) + row.join(''))
  }

  // Errors
  const hasErrors = report.results.some(r => r.errors > 0)
  if (hasErrors) {
    console.log('\n  Errors (total across all runs)')
    console.log()
    for (const r of report.results) {
      if (r.errors > 0) {
        console.log(`  ! ${r.framework} / ${r.scenario}: ${r.errors} errors`)
      }
    }
  }

  console.log('\n' + '═'.repeat(78))
  console.log()
}

function generateMarkdown(report: AggregatedReport): string {
  const frameworkNames = [...new Set(report.results.map(r => r.framework))]
  const scenarioNames = [...new Set(report.results.map(r => r.scenario))]

  const lines: string[] = [
    '## SSR Framework Benchmark Results',
    '',
    `> **${report.runs} runs** | ${report.config.duration}s duration | ${report.config.connections} connections | ${report.config.pipelining} pipelining`,
    `> Node ${report.system.nodeVersion} | ${report.system.platform} ${report.system.arch} | ${report.system.cpus} CPUs`,
    `> ${report.timestamp}`,
    '',
    '### Requests/sec (median, higher is better)',
    '',
    `| Scenario | ${frameworkNames.join(' | ')} |`,
    `|---|${frameworkNames.map(() => '---:').join('|')}|`,
  ]

  for (const sc of scenarioNames) {
    const cells = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r) return '—'
      return `**${fmtNum(r.rps.median)}**/s <sub>CV ${r.rps.cv.toFixed(1)}%</sub>`
    })
    lines.push(`| ${sc} | ${cells.join(' | ')} |`)
  }

  lines.push('', '### Latency p50 / p99 (median, lower is better)', '')
  lines.push(
    `| Scenario | ${frameworkNames.join(' | ')} |`,
    `|---|${frameworkNames.map(() => '---:').join('|')}|`,
  )

  for (const sc of scenarioNames) {
    const cells = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r) return '—'
      return `${fmtMs(r.latencyP50.median)} / ${fmtMs(r.latencyP99.median)}`
    })
    lines.push(`| ${sc} | ${cells.join(' | ')} |`)
  }

  if (report.soloTtfb.length > 0) {
    lines.push('', '### Solo TTFB (1 connection, median, lower is better)', '')
    lines.push(
      `| Scenario | ${frameworkNames.join(' | ')} |`,
      `|---|${frameworkNames.map(() => '---:').join('|')}|`,
    )

    for (const sc of scenarioNames) {
      const cells = frameworkNames.map(fw => {
        const r = report.soloTtfb.find(
          res => res.framework === fw && res.scenario === sc,
        )
        if (!r) return '—'
        return `${fmtMs(r.latencyP50.median)} / ${fmtMs(r.latencyP99.median)}`
      })
      lines.push(`| ${sc} | ${cells.join(' | ')} |`)
    }
  }

  lines.push('', '### Avg Response Size (lower is better)', '')
  lines.push(
    `| Scenario | ${frameworkNames.join(' | ')} |`,
    `|---|${frameworkNames.map(() => '---:').join('|')}|`,
  )

  for (const sc of scenarioNames) {
    const cells = frameworkNames.map(fw => {
      const r = report.results.find(
        res => res.framework === fw && res.scenario === sc,
      )
      if (!r || !r.rps.median) return '—'
      const bytesPerReq = r.throughput.median / r.rps.median
      return fmtBytes(bytesPerReq)
    })
    lines.push(`| ${sc} | ${cells.join(' | ')} |`)
  }

  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const outputMd = args.includes('--markdown')
  const outputJson = args.includes('--json')
  const pattern = args.find(a => !a.startsWith('--'))

  const reports = loadReports(pattern)
  if (reports.length === 0) {
    console.error('No benchmark result files found.')
    process.exit(1)
  }

  console.log(`Aggregating ${reports.length} benchmark runs...`)

  const lastReport = reports[reports.length - 1]!
  const aggregatedReport: AggregatedReport = {
    timestamp: new Date().toISOString(),
    runs: reports.length,
    config: lastReport.config,
    system: lastReport.system,
    results: aggregateResults(reports, 'results'),
    soloTtfb: aggregateResults(reports, 'soloTtfb'),
    rawFiles: (reports as (BenchmarkReport & { _file?: string })[]).map(
      r => r._file ?? 'unknown',
    ),
  }

  printAggregatedReport(aggregatedReport)

  if (outputJson) {
    const outPath = path.resolve(__dirname, 'aggregated-results.json')
    fs.writeFileSync(outPath, JSON.stringify(aggregatedReport, null, 2))
    console.log(`JSON saved to ${outPath}`)
  }

  if (outputMd) {
    const md = generateMarkdown(aggregatedReport)
    const outPath = path.resolve(__dirname, 'BENCHMARK-RESULTS.md')
    fs.writeFileSync(outPath, md)
    console.log(`Markdown saved to ${outPath}`)
  }
}

main()
