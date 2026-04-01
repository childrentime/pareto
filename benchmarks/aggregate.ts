import fs from 'fs'
import path from 'path'
import {
  RESULTS_DIR,
  type BenchmarkReport,
  type BenchmarkResult,
} from './report.js'
import { frameworks, scenarios } from './scenarios.js'
import { cv, fmtBytes, fmtMs, fmtNum, median, pad } from './utils.js'

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
  errorsPerRun: AggregatedMetric
  totalErrors: number
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

function aggregateMetric(values: number[]): AggregatedMetric {
  return {
    median: median(values),
    min: Math.min(...values),
    max: Math.max(...values),
    values,
    cv: cv(values),
  }
}

function loadReports(pattern?: string): BenchmarkReport[] {
  const defaultDir = RESULTS_DIR
  const patternLooksLikePath = pattern
    ? pattern.includes('/') ||
      pattern.includes('\\') ||
      pattern.endsWith('.json')
    : false
  const dir =
    pattern && patternLooksLikePath
      ? path.dirname(path.resolve(process.cwd(), pattern))
      : defaultDir
  if (!fs.existsSync(dir)) return []

  const files = fs
    .readdirSync(dir)
    .filter(f => f.startsWith('results-') && f.endsWith('.json'))
    .sort()
  if (files.length === 0) return []

  const targetFiles = pattern
    ? (() => {
        const raw = path.basename(pattern)
        const token = raw
          .replace(/^results-/, '')
          .replace(/\.json$/i, '')
          .trim()
        const matched = token ? files.filter(f => f.includes(token)) : files
        return matched
      })()
    : files

  if (pattern && targetFiles.length === 0) {
    throw new Error(`No benchmark files matched pattern "${pattern}" in ${dir}`)
  }

  return targetFiles.map(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf-8')
    return { ...JSON.parse(content), _file: f } as BenchmarkReport & {
      _file: string
    }
  })
}

function assertConsistentConfig(reports: BenchmarkReport[]): void {
  const groups = new Map<string, string[]>()

  for (const report of reports) {
    const key = JSON.stringify(report.config)
    const file =
      (report as BenchmarkReport & { _file?: string })._file ?? 'unknown'
    const existing = groups.get(key)
    if (existing) {
      existing.push(file)
    } else {
      groups.set(key, [file])
    }
  }

  if (groups.size <= 1) return

  const details = [...groups.entries()]
    .map(([config, files]) => `${config}\n  - ${files.join('\n  - ')}`)
    .join('\n\n')

  throw new Error(
    `Found mixed benchmark configs in result files. ` +
      `Please aggregate only comparable runs.\n\n${details}`,
  )
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

      const errorValues = runs.map(r => r.errors)

      aggregated.push({
        framework: fw,
        scenario: sc,
        runs: runs.length,
        rps: aggregateMetric(runs.map(r => r.requests.average)),
        latencyP50: aggregateMetric(runs.map(r => r.latency.p50)),
        latencyP99: aggregateMetric(runs.map(r => r.latency.p99)),
        throughput: aggregateMetric(runs.map(r => r.throughput.average)),
        errorsPerRun: aggregateMetric(errorValues),
        totalErrors: errorValues.reduce((s, v) => s + v, 0),
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

  // Errors (median per-run + total)
  const hasErrors = report.results.some(r => r.totalErrors > 0)
  if (hasErrors) {
    console.log('\n  Errors (median per-run / total across all runs)')
    console.log()
    for (const r of report.results) {
      if (r.totalErrors > 0) {
        console.log(
          `  ! ${r.framework} / ${r.scenario}: ` +
            `${fmtNum(r.errorsPerRun.median)} median/run, ` +
            `${r.totalErrors} total across ${r.runs} runs`,
        )
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

  assertConsistentConfig(reports)

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
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
    const outPath = path.resolve(RESULTS_DIR, 'aggregated-results.json')
    fs.writeFileSync(outPath, JSON.stringify(aggregatedReport, null, 2))
    console.log(`JSON saved to ${outPath}`)
  }

  if (outputMd) {
    const md = generateMarkdown(aggregatedReport)
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
    const outPath = path.resolve(RESULTS_DIR, 'BENCHMARK-RESULTS.md')
    fs.writeFileSync(outPath, md)
    console.log(`Markdown saved to ${outPath}`)
  }
}

main()
