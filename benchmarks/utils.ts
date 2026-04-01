import { type ChildProcess, spawn } from 'child_process'
import type { Framework } from './scenarios.js'

// ── Formatting helpers ────────────────────────────────────────────────

export function fmtNum(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export function fmtMs(n: number): string {
  if (n < 1000) return `${n.toFixed(1)}ms`
  return `${(n / 1000).toFixed(2)}s`
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / (1024 * 1024)).toFixed(1)}MB`
}

export function fmtOps(ops: number): string {
  if (ops >= 1_000_000) return `${(ops / 1_000_000).toFixed(2)}M`
  if (ops >= 1_000) return `${(ops / 1_000).toFixed(1)}K`
  return fmtNum(ops)
}

export function fmtTime(ms: number): string {
  if (ms < 0.001) return `${(ms * 1_000_000).toFixed(0)}ns`
  if (ms < 1) return `${(ms * 1_000).toFixed(1)}μs`
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function pad(
  str: string,
  len: number,
  align: 'left' | 'right' = 'left',
): string {
  if (align === 'right') return str.padStart(len)
  return str.padEnd(len)
}

// ── Logging ───────────────────────────────────────────────────────────

export function log(msg: string): void {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Server lifecycle ──────────────────────────────────────────────────

export async function waitForServer(
  port: number,
  timeout = 30_000,
): Promise<void> {
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

export function startServer(fw: Framework, baseDir: string): ChildProcess {
  const cwd = `${baseDir}/${fw.dir}`
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

export function killServer(child: ChildProcess): Promise<void> {
  return new Promise(resolve => {
    if (child.killed || child.exitCode !== null) {
      resolve()
      return
    }

    let resolved = false
    const done = () => {
      if (resolved) return
      resolved = true
      resolve()
    }

    child.on('exit', done)

    // Try graceful shutdown first so frameworks can flush/close sockets.
    try {
      process.kill(-child.pid!, 'SIGTERM')
    } catch {
      child.kill('SIGTERM')
    }

    setTimeout(() => {
      if (resolved) return
      try {
        process.kill(-child.pid!, 'SIGKILL')
      } catch {
        child.kill('SIGKILL')
      }
    }, 3000)

    try {
      process.kill(-child.pid!, 0)
      // Process group still alive; final safety timeout.
      setTimeout(done, 5000)
    } catch {
      setTimeout(done, 100)
    }
  })
}

// ── Statistics ────────────────────────────────────────────────────────

export function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

export function cv(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  if (mean === 0) return 0
  const variance =
    arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1)
  return (Math.sqrt(variance) / mean) * 100
}

/** Percentile from a sorted array (0-1 range, e.g. 0.99 for p99) */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(sorted.length * p) - 1
  return sorted[Math.max(0, idx)]!
}
