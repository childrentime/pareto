import { performance } from 'perf_hooks'
import React from 'react'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { PassThrough, Writable } from 'stream'
import { fmtBytes, fmtNum, fmtOps, fmtTime, pad, percentile } from './utils.js'

const ITEM_COUNTS = [10, 100, 500] as const
const WARMUP_ITERATIONS = 500
const MIN_TIME_MS = 3000
const MIN_ITERATIONS = 100

const BENCH_SINK_KEY = '__paretoRenderBenchSink'

function consumeResult(value: unknown): void {
  ;(globalThis as Record<string, unknown>)[BENCH_SINK_KEY] = value
}

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `Description for item ${i + 1} with some additional text to make the output realistic`,
  }))
}

function ListPage({ items }: { items: ReturnType<typeof generateItems> }) {
  return (
    <html>
      <head>
        <title>Benchmark</title>
      </head>
      <body>
        <div id="root">
          <h1>SSR Benchmark</h1>
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </body>
    </html>
  )
}

function DataPage({
  users,
  meta,
}: {
  users: { id: number; name: string; email: string }[]
  meta: { total: number; page: number }
}) {
  return (
    <html>
      <head>
        <title>Data Page</title>
      </head>
      <body>
        <div id="root">
          <h1>Data Loading Benchmark</h1>
          <p>
            Total: {meta.total} | Page: {meta.page}
          </p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  )
}

function streamToDevNull(element: React.ReactElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const sink = new Writable({
      write(_chunk, _encoding, callback) {
        callback()
      },
    })
    sink.on('finish', () => resolve())
    sink.on('error', reject)

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(sink)
      },
      onError: reject,
    })
  })
}

function collectStream(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const writable = new PassThrough()
    writable.on('data', (chunk: Buffer) => chunks.push(chunk))
    writable.on('end', () => resolve(Buffer.concat(chunks).toString()))
    writable.on('error', reject)

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(writable)
      },
      onError: reject,
    })
  })
}

interface BenchResult {
  opsPerSec: number
  meanMs: number
  iterations: number
  totalMs: number
  samples: number[]
  p50Ms: number
  p99Ms: number
}

function benchSync(fn: () => unknown): BenchResult {
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    consumeResult(fn())
  }

  const samples: number[] = []
  const start = performance.now()
  let iterations = 0

  while (true) {
    const t0 = performance.now()
    consumeResult(fn())
    const t1 = performance.now()
    samples.push(t1 - t0)
    iterations++

    if (
      iterations >= MIN_ITERATIONS &&
      performance.now() - start >= MIN_TIME_MS
    )
      break
  }

  const totalMs = performance.now() - start
  samples.sort((a, b) => a - b)

  return {
    opsPerSec: (iterations / totalMs) * 1000,
    meanMs: totalMs / iterations,
    iterations,
    totalMs,
    samples,
    p50Ms: percentile(samples, 0.5),
    p99Ms: percentile(samples, 0.99),
  }
}

async function benchAsync(fn: () => Promise<unknown>): Promise<BenchResult> {
  for (let i = 0; i < Math.min(WARMUP_ITERATIONS, 100); i++) {
    consumeResult(await fn())
  }

  const samples: number[] = []
  const start = performance.now()
  let iterations = 0

  while (true) {
    const t0 = performance.now()
    consumeResult(await fn())
    const t1 = performance.now()
    samples.push(t1 - t0)
    iterations++

    if (
      iterations >= MIN_ITERATIONS &&
      performance.now() - start >= MIN_TIME_MS
    )
      break
  }

  const totalMs = performance.now() - start
  samples.sort((a, b) => a - b)

  return {
    opsPerSec: (iterations / totalMs) * 1000,
    meanMs: totalMs / iterations,
    iterations,
    totalMs,
    samples,
    p50Ms: percentile(samples, 0.5),
    p99Ms: percentile(samples, 0.99),
  }
}

function printRow(label: string, r: BenchResult) {
  console.log(
    '  ' +
      pad(label, 22) +
      pad(fmtOps(r.opsPerSec) + '/s', 14, 'right') +
      pad(fmtTime(r.meanMs), 12, 'right') +
      pad(fmtTime(r.p50Ms), 12, 'right') +
      pad(fmtTime(r.p99Ms), 12, 'right') +
      pad(fmtNum(r.iterations), 10, 'right'),
  )
}

function printHeader() {
  console.log(
    '  ' +
      pad('Component', 22) +
      pad('ops/sec', 14, 'right') +
      pad('mean', 12, 'right') +
      pad('p50', 12, 'right') +
      pad('p99', 12, 'right') +
      pad('iters', 10, 'right'),
  )
  console.log('  ' + '─'.repeat(82))
}

async function main() {
  console.log()
  console.log('═'.repeat(84))
  console.log('  Pure React SSR Render Benchmark')
  console.log('═'.repeat(84))
  console.log(`  Node ${process.version} | ${process.platform} ${process.arch}`)
  console.log(
    `  Min time: ${MIN_TIME_MS}ms | Warmup: ${WARMUP_ITERATIONS} iterations`,
  )
  console.log('─'.repeat(84))

  // ── Output size measurement ──────────────────────────────────────────
  console.log('\n  HTML Output Size')
  console.log()
  console.log('  ' + pad('Component', 22) + pad('Size', 12, 'right'))
  console.log('  ' + '─'.repeat(34))

  for (const count of ITEM_COUNTS) {
    const items = generateItems(count)
    const html = renderToString(<ListPage items={items} />)
    console.log(
      '  ' +
        pad(`List (${count} items)`, 22) +
        pad(fmtBytes(html.length), 12, 'right'),
    )
  }

  const dataUsers = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
  }))
  const dataHtml = renderToString(
    <DataPage users={dataUsers} meta={{ total: 50, page: 1 }} />,
  )
  console.log(
    '  ' +
      pad('Data (50 users)', 22) +
      pad(fmtBytes(dataHtml.length), 12, 'right'),
  )

  // Stream output size
  const streamHtml = await collectStream(
    <ListPage items={generateItems(100)} />,
  )
  console.log(
    '  ' +
      pad('Stream (100 items)', 22) +
      pad(fmtBytes(streamHtml.length), 12, 'right'),
  )

  // ── renderToString benchmark ─────────────────────────────────────────
  console.log('\n  renderToString (higher ops/sec is better)')
  console.log()
  printHeader()

  for (const count of ITEM_COUNTS) {
    const items = generateItems(count)
    const element = <ListPage items={items} />
    const result = benchSync(() => renderToString(element))
    printRow(`List (${count} items)`, result)
  }

  {
    const element = <DataPage users={dataUsers} meta={{ total: 50, page: 1 }} />
    const result = benchSync(() => renderToString(element))
    printRow('Data (50 users)', result)
  }

  // ── renderToPipeableStream benchmark ─────────────────────────────────
  console.log('\n  renderToPipeableStream (higher ops/sec is better)')
  console.log()
  printHeader()

  for (const count of ITEM_COUNTS) {
    const items = generateItems(count)
    const element = <ListPage items={items} />
    const result = await benchAsync(async () => streamToDevNull(element))
    printRow(`List (${count} items)`, result)
  }

  // ── renderToString vs renderToPipeableStream ─────────────────────────
  console.log('\n  renderToString vs renderToPipeableStream (100 items)')
  console.log()

  const compItems = generateItems(100)
  const compElement = <ListPage items={compItems} />

  const syncResult = benchSync(() => renderToString(compElement))
  const asyncResult = await benchAsync(async () => streamToDevNull(compElement))

  console.log(
    `  renderToString:          ${fmtOps(syncResult.opsPerSec)}/s  (mean ${fmtTime(syncResult.meanMs)})`,
  )
  console.log(
    `  renderToPipeableStream:  ${fmtOps(asyncResult.opsPerSec)}/s  (mean ${fmtTime(asyncResult.meanMs)})`,
  )

  const ratio = syncResult.opsPerSec / asyncResult.opsPerSec
  if (ratio > 1) {
    console.log(`  renderToString is ${ratio.toFixed(2)}x faster`)
  } else {
    console.log(`  renderToPipeableStream is ${(1 / ratio).toFixed(2)}x faster`)
  }

  console.log('\n' + '═'.repeat(84))
  console.log()
}

main().catch(err => {
  console.error('Render benchmark failed:', err)
  process.exit(1)
})
