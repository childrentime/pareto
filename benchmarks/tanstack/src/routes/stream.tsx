import { Await, createFileRoute } from '@tanstack/react-router'
import { Suspense } from 'react'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const Route = createFileRoute('/stream')({
  loader: () => {
    const instant = { title: 'Quick Stats', count: 42 }

    const delayed = sleep(200).then(() =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `Record ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
      })),
    )

    return { instant, delayed }
  },
  component: StreamPage,
})

function StreamPage() {
  const { instant, delayed } = Route.useLoaderData()

  return (
    <div>
      <h1>Streaming SSR Benchmark</h1>
      <section>
        <h2>{instant.title}</h2>
        <p>Count: {instant.count}</p>
      </section>
      <section>
        <Suspense fallback={<p>Loading records...</p>}>
          <Await promise={delayed}>
            {records => (
              <ul>
                {records.map(r => (
                  <li key={r.id}>
                    {r.name}: {r.value}
                  </li>
                ))}
              </ul>
            )}
          </Await>
        </Suspense>
      </section>
    </div>
  )
}
