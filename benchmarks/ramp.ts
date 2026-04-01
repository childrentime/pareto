import autocannon from 'autocannon'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RESULTS_DIR } from './report.js'
import { frameworks, scenarios, type Framework } from './scenarios.js'
import {
  fmtMs,
  fmtNum,
  killServer,
  log,
  pad,
  sleep,
  startServer,
  waitForServer,
} from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const onlyFlag =
  args.find(a => a.startsWith('--only='))?.split('=')[1] ??
  (args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : undefined)
const scenarioFilter = args
  .find(a => a.startsWith('--scenario='))
  ?.split('=')[1]

const CONCURRENCY_STEPS = [1, 10, 50, 100, 200, 500, 1000]
const STEP_DURATION = 8
const P99_THRESHOLD_MS = 500
const ERROR_RATE_THRESHOLD = 0.01

const activeFrameworks = onlyFlag
  ? frameworks.filter(
      f =>
        f.dir === onlyFlag || f.name.toLowerCase() === onlyFlag.toLowerCase(),
    )
  : frameworks

const activeScenarios = scenarioFilter
  ? scenarios.filter(s =>
      s.name.toLowerCase().includes(scenarioFilter.toLowerCase()),
    )
  : scenarios

interface StepResult {
  connections: number
  rps: number
  latencyP50: number
  latencyP99: number
  latencyAvg: number
  errors: number
  timeouts: number
  non2xx: number
  totalRequests: number
  errorRate: number
}

interface RampResult {
  framework: string
  scenario: string
  steps: StepResult[]
  maxSustainableQPS: number
  maxConnections: number
  hasHealthyStep: boolean
}

function buildFramework(fw: Framework): void {
  log(`Building ${fw.name}...`)
  const cwd = path.resolve(__dirname, fw.dir)
  execSync(fw.buildCmd, {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' },
  })
  log(`${fw.name} build complete`)
}

async function rampTest(url: string, steps: number[]): Promise<StepResult[]> {
  // Warmup
  await autocannon({
    url,
    duration: 3,
    connections: 10,
    pipelining: 1,
  })

  const results: StepResult[] = []

  for (const connections of steps) {
    const raw = await autocannon({
      url,
      duration: STEP_DURATION,
      connections,
      pipelining: 1,
    })

    const totalRequests = raw.requests?.total ?? 0
    const totalFailures =
      (raw.errors ?? 0) + (raw.timeouts ?? 0) + (raw.non2xx ?? 0)
    const errorRate = totalRequests > 0 ? totalFailures / totalRequests : 0

    const step: StepResult = {
      connections,
      rps: raw.requests?.average ?? 0,
      latencyP50: raw.latency?.p50 ?? 0,
      latencyP99: raw.latency?.p99 ?? 0,
      latencyAvg: raw.latency?.average ?? 0,
      errors: raw.errors ?? 0,
      timeouts: raw.timeouts ?? 0,
      non2xx: raw.non2xx ?? 0,
      totalRequests,
      errorRate,
    }
    results.push(step)

    log(
      `  ${connections} conn → ${fmtNum(step.rps)}/s, ` +
        `p50=${fmtMs(step.latencyP50)}, p99=${fmtMs(step.latencyP99)}, ` +
        `failures=${step.errors + step.timeouts + step.non2xx}`,
    )

    if (step.latencyP99 > P99_THRESHOLD_MS * 3 || errorRate > 0.1) {
      log(`  ⚠ Server overloaded at ${connections} connections, stopping ramp`)
      break
    }

    await sleep(2000)
  }

  return results
}

function findMaxQPS(steps: StepResult[]): {
  qps: number
  connections: number
  hasHealthyStep: boolean
} {
  let maxQPS = 0
  let maxConn = 0
  let hasHealthyStep = false

  for (const step of steps) {
    const healthy =
      step.latencyP99 <= P99_THRESHOLD_MS &&
      step.errorRate <= ERROR_RATE_THRESHOLD

    if (healthy && step.rps > maxQPS) {
      maxQPS = step.rps
      maxConn = step.connections
      hasHealthyStep = true
    }
  }

  return { qps: maxQPS, connections: maxConn, hasHealthyStep }
}

function printResults(results: RampResult[]): void {
  const frameworkNames = [...new Set(results.map(r => r.framework))]
  const scenarioNames = [...new Set(results.map(r => r.scenario))]

  console.log('\n')
  console.log('═'.repeat(78))
  console.log('  Ramp-up Load Test — Max Sustainable QPS')
  console.log('═'.repeat(78))
  console.log(
    `  Criteria: p99 ≤ ${P99_THRESHOLD_MS}ms, error rate ≤ ${(ERROR_RATE_THRESHOLD * 100).toFixed(0)}%`,
  )
  console.log(
    `  Steps: ${CONCURRENCY_STEPS.join(', ')} connections | ${STEP_DURATION}s per step`,
  )
  console.log(`  Node ${process.version} | ${process.platform} ${process.arch}`)
  console.log('─'.repeat(78))

  // Summary table
  const colWidth = 20
  console.log('\n  Max Sustainable QPS (p99 ≤ 500ms, error ≤ 1%)')
  console.log()
  console.log(
    '  ' +
      pad('Scenario', 16) +
      frameworkNames.map(n => pad(n, colWidth, 'right')).join(''),
  )
  console.log('  ' + '─'.repeat(16 + colWidth * frameworkNames.length))

  for (const sc of scenarioNames) {
    const row = frameworkNames.map(fw => {
      const r = results.find(res => res.framework === fw && res.scenario === sc)
      if (!r) return pad('—', colWidth, 'right')
      if (!r.hasHealthyStep) return pad('NO HEALTHY STEP', colWidth, 'right')
      return pad(`${fmtNum(r.maxSustainableQPS)}/s`, colWidth, 'right')
    })
    console.log('  ' + pad(sc, 16) + row.join(''))
  }

  // Detail per scenario
  for (const sc of scenarioNames) {
    console.log(`\n  ── ${sc} ──`)
    console.log()

    const headerCols = ['Connections']
    for (const fw of frameworkNames) {
      headerCols.push(`${fw} QPS`, `${fw} p99`)
    }
    const detailColWidth = 14
    console.log(
      '  ' +
        headerCols
          .map((h, i) =>
            pad(h, i === 0 ? 12 : detailColWidth, i === 0 ? 'left' : 'right'),
          )
          .join(''),
    )
    console.log(
      '  ' + '─'.repeat(12 + detailColWidth * (frameworkNames.length * 2)),
    )

    const allStepConns = new Set<number>()
    for (const r of results.filter(r => r.scenario === sc)) {
      for (const s of r.steps) allStepConns.add(s.connections)
    }

    for (const conn of [...allStepConns].sort((a, b) => a - b)) {
      const cols: string[] = [pad(String(conn), 12)]
      for (const fw of frameworkNames) {
        const r = results.find(
          res => res.framework === fw && res.scenario === sc,
        )
        const step = r?.steps.find(s => s.connections === conn)
        if (!step) {
          cols.push(pad('—', detailColWidth, 'right'))
          cols.push(pad('—', detailColWidth, 'right'))
        } else {
          const marker =
            step.latencyP99 > P99_THRESHOLD_MS ||
            step.errorRate > ERROR_RATE_THRESHOLD
              ? ' !'
              : ''
          cols.push(
            pad(`${fmtNum(step.rps)}/s${marker}`, detailColWidth, 'right'),
          )
          cols.push(pad(fmtMs(step.latencyP99), detailColWidth, 'right'))
        }
      }
      console.log('  ' + cols.join(''))
    }
  }

  console.log('\n  ! = exceeded threshold (p99 > 500ms or error > 1%)')
  console.log('\n' + '═'.repeat(78))
  console.log()
}

function generateMarkdown(results: RampResult[]): string {
  const frameworkNames = [...new Set(results.map(r => r.framework))]
  const scenarioNames = [...new Set(results.map(r => r.scenario))]

  const lines: string[] = [
    '## Max Sustainable QPS (Ramp-up Load Test)',
    '',
    `> Criteria: p99 ≤ ${P99_THRESHOLD_MS}ms, error rate ≤ ${(ERROR_RATE_THRESHOLD * 100).toFixed(0)}%`,
    `> Steps: ${CONCURRENCY_STEPS.join(', ')} connections | ${STEP_DURATION}s per step`,
    `> Node ${process.version} | ${process.platform} ${process.arch}`,
    '',
    '### Summary',
    '',
    `| Scenario | ${frameworkNames.join(' | ')} |`,
    `|---|${frameworkNames.map(() => '---:').join('|')}|`,
  ]

  for (const sc of scenarioNames) {
    const cells = frameworkNames.map(fw => {
      const r = results.find(res => res.framework === fw && res.scenario === sc)
      if (!r) return '—'
      if (!r.hasHealthyStep) return 'NO HEALTHY STEP'
      return `**${fmtNum(r.maxSustainableQPS)}**/s`
    })
    lines.push(`| ${sc} | ${cells.join(' | ')} |`)
  }

  for (const sc of scenarioNames) {
    lines.push('', `### ${sc} — Detail`, '')

    const header = ['Connections']
    for (const fw of frameworkNames) header.push(`${fw} QPS`, `${fw} p99`)
    lines.push(`| ${header.join(' | ')} |`)
    lines.push(
      `|---|${header
        .slice(1)
        .map(() => '---:')
        .join('|')}|`,
    )

    const allStepConns = new Set<number>()
    for (const r of results.filter(r => r.scenario === sc)) {
      for (const s of r.steps) allStepConns.add(s.connections)
    }

    for (const conn of [...allStepConns].sort((a, b) => a - b)) {
      const cells: string[] = [String(conn)]
      for (const fw of frameworkNames) {
        const r = results.find(
          res => res.framework === fw && res.scenario === sc,
        )
        const step = r?.steps.find(s => s.connections === conn)
        if (!step) {
          cells.push('—', '—')
        } else {
          cells.push(`${fmtNum(step.rps)}/s`, fmtMs(step.latencyP99))
        }
      }
      lines.push(`| ${cells.join(' | ')} |`)
    }
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Main — test one framework at a time to avoid resource contention
// ---------------------------------------------------------------------------

async function main() {
  if (activeFrameworks.length === 0) {
    console.error(`Unknown framework: ${onlyFlag}`)
    console.error(`Available: ${frameworks.map(f => f.dir).join(', ')}`)
    process.exit(1)
  }
  if (activeScenarios.length === 0) {
    console.error(`Unknown scenario filter: ${scenarioFilter}`)
    console.error(`Available: ${scenarios.map(s => s.name).join(', ')}`)
    process.exit(1)
  }

  console.log()
  log('Ramp-up Load Test — Finding Max Sustainable QPS')
  log(`Frameworks: ${activeFrameworks.map(f => f.name).join(', ')}`)
  log(`Scenarios: ${activeScenarios.map(s => s.name).join(', ')}`)
  log(
    `Steps: ${CONCURRENCY_STEPS.join(', ')} connections, ${STEP_DURATION}s each`,
  )
  log(
    `Thresholds: p99 ≤ ${P99_THRESHOLD_MS}ms, error ≤ ${(ERROR_RATE_THRESHOLD * 100).toFixed(0)}%`,
  )
  console.log()

  if (!skipBuild) {
    for (const fw of activeFrameworks) {
      try {
        buildFramework(fw)
      } catch (err) {
        console.error(`Failed to build ${fw.name}:`, err)
        process.exit(1)
      }
    }
  } else {
    log('Skipping build (--skip-build)')
  }

  const allResults: RampResult[] = []

  // Test one framework at a time to avoid resource contention
  for (const fw of activeFrameworks) {
    log(`Starting ${fw.name} on port ${fw.port}...`)
    const server = startServer(fw, __dirname)

    try {
      await waitForServer(fw.port)
      log(`${fw.name} ready on :${fw.port}`)
      console.log()

      for (const scenario of activeScenarios) {
        if (fw.skipScenarios?.includes(scenario.name)) {
          log(`Skipping ${fw.name} / ${scenario.name} (not supported)`)
          continue
        }

        log(`━━━ ${scenario.name}: ${scenario.description} ━━━`)
        const url = `http://127.0.0.1:${fw.port}${scenario.path}`
        log(`Ramp testing ${fw.name} @ ${url}`)

        const steps = await rampTest(url, CONCURRENCY_STEPS)
        const { qps, connections, hasHealthyStep } = findMaxQPS(steps)

        allResults.push({
          framework: fw.name,
          scenario: scenario.name,
          steps,
          maxSustainableQPS: qps,
          maxConnections: connections,
          hasHealthyStep,
        })

        if (!hasHealthyStep) {
          log(
            `→ ${fw.name} max sustainable: NO HEALTHY STEP ` +
              `(all steps exceeded thresholds)`,
          )
        } else {
          log(
            `→ ${fw.name} max sustainable: ${fmtNum(qps)}/s @ ${connections} connections`,
          )
        }
        console.log()
      }
    } finally {
      log(`Shutting down ${fw.name}...`)
      await killServer(server)
      await sleep(2000)
    }
  }

  printResults(allResults)

  fs.mkdirSync(RESULTS_DIR, { recursive: true })
  const outPath = path.resolve(
    RESULTS_DIR,
    `ramp-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
  )
  fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2))
  log(`JSON saved to ${outPath}`)

  const md = generateMarkdown(allResults)
  const mdPath = path.resolve(RESULTS_DIR, 'RAMP-RESULTS.md')
  fs.writeFileSync(mdPath, md)
  log(`Markdown saved to ${mdPath}`)
}

main().catch(err => {
  console.error('Ramp test failed:', err)
  process.exit(1)
})
