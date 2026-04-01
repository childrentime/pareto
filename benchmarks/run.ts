import autocannon from 'autocannon'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { printReport, saveReport, type BenchmarkResult } from './report.js'
import {
  defaultConfig,
  frameworks,
  scenarios,
  type AutocannonConfig,
  type Framework,
} from './scenarios.js'
import { killServer, log, sleep, startServer, waitForServer } from './utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
function readArgValue(flag: string): string | undefined {
  const inline = args.find(a => a.startsWith(`--${flag}=`))
  if (inline) return inline.split('=')[1]
  const idx = args.indexOf(`--${flag}`)
  return idx !== -1 ? args[idx + 1] : undefined
}
const onlyFlag =
  args.find(a => a.startsWith('--only='))?.split('=')[1] ??
  (args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : undefined)
const skipBuild = args.includes('--skip-build')
const durationOverride = readArgValue('duration')
const connectionsOverride = readArgValue('connections')
const pipeliningOverride = readArgValue('pipelining')

function parsePositiveInt(
  value: string | undefined,
  flagName: string,
): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.error(`Invalid ${flagName}: ${value}. Must be a positive integer.`)
    process.exit(1)
  }
  return parsed
}

const durationValue = parsePositiveInt(durationOverride, '--duration')
const connectionsValue = parsePositiveInt(connectionsOverride, '--connections')
const pipeliningValue = parsePositiveInt(pipeliningOverride, '--pipelining')

const config: AutocannonConfig = {
  ...defaultConfig,
  ...(durationValue ? { duration: durationValue } : {}),
  ...(connectionsValue ? { connections: connectionsValue } : {}),
  ...(pipeliningValue ? { pipelining: pipeliningValue } : {}),
}
const hasConnectionsOverride =
  connectionsValue !== undefined ||
  args.some(a => a === '--connections' || a.startsWith('--connections='))
const hasPipeliningOverride =
  pipeliningValue !== undefined ||
  args.some(a => a === '--pipelining' || a.startsWith('--pipelining='))

const activeFrameworks = onlyFlag
  ? frameworks.filter(
      f =>
        f.dir === onlyFlag || f.name.toLowerCase() === onlyFlag.toLowerCase(),
    )
  : frameworks

if (activeFrameworks.length === 0) {
  console.error(`Unknown framework: ${onlyFlag}`)
  console.error(`Available: ${frameworks.map(f => f.dir).join(', ')}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

async function runBenchmark(
  url: string,
  benchConfig: AutocannonConfig,
): Promise<autocannon.Result> {
  // Warmup
  await autocannon({
    url,
    duration: benchConfig.warmupDuration,
    connections: benchConfig.connections,
    pipelining: benchConfig.pipelining,
  })

  // Actual benchmark
  return autocannon({
    url,
    duration: benchConfig.duration,
    connections: benchConfig.connections,
    pipelining: benchConfig.pipelining,
  })
}

function extractResult(
  raw: autocannon.Result,
  frameworkName: string,
  scenarioName: string,
): BenchmarkResult {
  return {
    framework: frameworkName,
    scenario: scenarioName,
    requests: {
      total: raw.requests?.total ?? 0,
      average: raw.requests?.average ?? 0,
      mean: raw.requests?.mean ?? 0,
      stddev: raw.requests?.stddev ?? 0,
      min: raw.requests?.min ?? 0,
      max: raw.requests?.max ?? 0,
    },
    latency: {
      average: raw.latency?.average ?? 0,
      mean: raw.latency?.mean ?? 0,
      stddev: raw.latency?.stddev ?? 0,
      min: raw.latency?.min ?? 0,
      max: raw.latency?.max ?? 0,
      p50: raw.latency?.p50 ?? 0,
      p90: raw.latency?.p90 ?? 0,
      p99: raw.latency?.p99 ?? 0,
    },
    throughput: {
      average: raw.throughput?.average ?? 0,
      mean: raw.throughput?.mean ?? 0,
      stddev: raw.throughput?.stddev ?? 0,
      min: raw.throughput?.min ?? 0,
      max: raw.throughput?.max ?? 0,
      total: raw.throughput?.total ?? 0,
    },
    duration: raw.duration ?? 0,
    errors: raw.errors ?? 0,
    timeouts: raw.timeouts ?? 0,
    non2xx: raw.non2xx ?? 0,
  }
}

// ---------------------------------------------------------------------------
// Main — test one framework at a time to avoid resource contention
// ---------------------------------------------------------------------------

async function main() {
  console.log()
  log('SSR Framework Benchmark')
  log(`Frameworks: ${activeFrameworks.map(f => f.name).join(', ')}`)
  log(`Scenarios: ${scenarios.map(s => s.name).join(', ')}`)
  log(
    `Config: ${config.duration}s duration, ${config.connections} connections, ${config.pipelining} pipelining`,
  )
  console.log()

  // Build all first (no server running)
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

  const allResults: BenchmarkResult[] = []
  const soloResults: BenchmarkResult[] = []

  // Test one framework at a time to avoid resource contention
  for (const fw of activeFrameworks) {
    log(`Starting ${fw.name} on port ${fw.port}...`)
    const server = startServer(fw, __dirname)

    try {
      await waitForServer(fw.port)
      log(`${fw.name} ready on :${fw.port}`)
      console.log()

      // Run all scenarios for this framework
      for (const scenario of scenarios) {
        if (fw.skipScenarios?.includes(scenario.name)) {
          log(`Skipping ${fw.name} / ${scenario.name} (not supported)`)
          continue
        }

        const url = `http://127.0.0.1:${fw.port}${scenario.path}`
        log(`Benchmarking ${fw.name} @ ${url} — ${scenario.description}`)

        const scenarioConfig: AutocannonConfig = {
          ...config,
          ...(!hasConnectionsOverride && scenario.connections
            ? { connections: scenario.connections }
            : {}),
          ...(!hasPipeliningOverride && scenario.pipelining
            ? { pipelining: scenario.pipelining }
            : {}),
        }
        const raw = await runBenchmark(url, scenarioConfig)
        const result = extractResult(raw, fw.name, scenario.name)
        allResults.push(result)

        log(
          `  ${fw.name}: ${result.requests.average.toLocaleString()}/s avg, ` +
            `p50=${result.latency.p50}ms, p99=${result.latency.p99}ms`,
        )
      }

      // Solo TTFB pass (1 connection, no pipelining — measures uncontended TTFB)
      log(`--- Solo TTFB for ${fw.name} (1 connection) ---`)

      for (const scenario of scenarios) {
        if (fw.skipScenarios?.includes(scenario.name)) continue
        const url = `http://127.0.0.1:${fw.port}${scenario.path}`
        log(`TTFB ${fw.name} @ ${url}`)

        // Warmup before TTFB measurement
        await autocannon({
          url,
          duration: 2,
          connections: 1,
          pipelining: 1,
        })

        const raw = await autocannon({
          url,
          duration: Math.max(5, Math.floor(config.duration / 2)),
          connections: 1,
          pipelining: 1,
        })
        const result = extractResult(raw, fw.name, scenario.name)
        soloResults.push(result)

        log(
          `  ${fw.name}: p50=${result.latency.p50}ms, p99=${result.latency.p99}ms`,
        )
      }

      console.log()
    } finally {
      // Kill server before moving to next framework
      log(`Shutting down ${fw.name}...`)
      await killServer(server)
      // Brief cooldown between frameworks
      await sleep(2000)
    }
  }

  // Report
  printReport(
    allResults,
    scenarios,
    activeFrameworks,
    {
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining,
    },
    soloResults,
  )

  const jsonPath = saveReport(
    allResults,
    {
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining,
    },
    soloResults,
  )
  log(`Results saved to ${jsonPath}`)
}

main().catch(err => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
