import { Suspense } from 'react'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getDelayedRecords() {
  await sleep(200)
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Record ${i + 1}`,
    value: Math.floor(Math.random() * 1000),
  }))
}

async function DelayedRecords() {
  const records = await getDelayedRecords()
  return (
    <ul>
      {records.map(r => (
        <li key={r.id}>
          {r.name}: {r.value}
        </li>
      ))}
    </ul>
  )
}

export const dynamic = 'force-dynamic'

export default function StreamPage() {
  return (
    <div>
      <h1>Streaming SSR Benchmark</h1>
      <section>
        <h2>Quick Stats</h2>
        <p>Count: 42</p>
      </section>
      <section>
        <Suspense fallback={<p>Loading records...</p>}>
          <DelayedRecords />
        </Suspense>
      </section>
    </div>
  )
}
