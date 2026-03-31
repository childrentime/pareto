import { execSync, spawn, type ChildProcess } from 'child_process'
import { createRequire } from 'module'
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const _require = createRequire(import.meta.url)

// autocannon ships no TS types
const autocannon = _require('autocannon') as (
  opts: Record<string, unknown>,
) => Promise<Record<string, any>>

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const onlyFlag =
  args.find(a => a.startsWith('--only='))?.split('=')[1] ??
  (args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : undefined)
const skipBuild = args.includes('--skip-build')
const durationOverride = args
  .find(a => a.startsWith('--duration='))
  ?.split('=')[1]
const connectionsOverride = args
  .find(a => a.startsWith('--connections='))
  ?.split('=')[1]

const config: AutocannonConfig = {
  ...defaultConfig,
  ...(durationOverride ? { duration: parseInt(durationOverride, 10) } : {}),
  ...(connectionsOverride
    ? { connections: parseInt(connectionsOverride, 10) }
    : {}),
}

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

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function waitForServer(port: number, timeout = 30_000): Promise<void> {
  const start = Date.now()
  const url = `http://127.0.0.1:${port}/`
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // not ready yet
    }
    await sleep(500)
  }
  throw new Error(`Server on port ${port} did not start within ${timeout}ms`)
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

function startServer(fw: Framework): ChildProcess {
  const cwd = path.resolve(__dirname, fw.dir)
  const child = spawn('sh', ['-c', fw.startCmd], {
    cwd,
    stdio: 'pipe',
    detached: true,
    env: { ...process.env, ...fw.startEnv },
  })
  child.unref()

  child.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) log(`[${fw.name} stderr] ${msg}`)
  })

  return child
}

function killServer(child: ChildProcess): Promise<void> {
  return new Promise(resolve => {
    if (child.killed || child.exitCode !== null) {
      resolve()
      return
    }

    const done = () => {
      child.removeListener('exit', done)
      resolve()
    }
    child.on('exit', done)

    try {
      process.kill(-child.pid!, 'SIGKILL')
    } catch {
      child.kill('SIGKILL')
    }

    setTimeout(done, 2000)
  })
}

async function runBenchmark(
  url: string,
  benchConfig: AutocannonConfig,
): Promise<Record<string, any>> {
  // Warmup
  await autocannon({
    url,
    duration: benchConfig.warmupDuration,
    connections: Math.min(benchConfig.connections, 50),
    pipelining: 1,
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
  raw: Record<string, any>,
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
      p95: raw.latency?.p95 ?? raw.latency?.p90 ?? 0,
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
// Main
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

  // Build
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
  const servers: ChildProcess[] = []

  try {
    // Start all servers
    for (const fw of activeFrameworks) {
      log(`Starting ${fw.name} on port ${fw.port}...`)
      const child = startServer(fw)
      servers.push(child)
      await waitForServer(fw.port)
      log(`${fw.name} ready on :${fw.port}`)
    }

    console.log()

    // Run benchmarks sequentially per scenario, per framework
    for (const scenario of scenarios) {
      log(`--- ${scenario.name}: ${scenario.description} ---`)

      for (const fw of activeFrameworks) {
        const url = `http://127.0.0.1:${fw.port}${scenario.path}`
        log(`Benchmarking ${fw.name} @ ${url}`)

        const scenarioConfig: AutocannonConfig = {
          ...config,
          ...(scenario.connections
            ? { connections: scenario.connections }
            : {}),
          ...(scenario.pipelining ? { pipelining: scenario.pipelining } : {}),
        }
        const raw = await runBenchmark(url, scenarioConfig)
        const result = extractResult(raw, fw.name, scenario.name)
        allResults.push(result)

        log(
          `  ${fw.name}: ${result.requests.average.toLocaleString()}/s avg, ` +
            `p50=${result.latency.p50}ms, p99=${result.latency.p99}ms`,
        )
      }

      console.log()
    }

    // Solo TTFB pass (1 connection, no pipelining — measures uncontended TTFB)
    log('--- Solo TTFB (1 connection) ---')
    const soloResults: BenchmarkResult[] = []

    for (const scenario of scenarios) {
      for (const fw of activeFrameworks) {
        const url = `http://127.0.0.1:${fw.port}${scenario.path}`
        log(`TTFB ${fw.name} @ ${url}`)

        const raw = await autocannon({
          url,
          duration: Math.max(3, Math.floor(config.duration / 2)),
          connections: 1,
          pipelining: 1,
        })
        const result = extractResult(
          raw as Record<string, any>,
          fw.name,
          scenario.name,
        )
        soloResults.push(result)

        log(
          `  ${fw.name}: p50=${result.latency.p50}ms, p99=${result.latency.p99}ms`,
        )
      }
    }
    console.log()

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
  } finally {
    // Cleanup
    log('Shutting down servers...')
    await Promise.all(servers.map(killServer))
    log('Done')
  }
}

main().catch(err => {
  console.error('Benchmark failed:', err)
  process.exit(1)
})
