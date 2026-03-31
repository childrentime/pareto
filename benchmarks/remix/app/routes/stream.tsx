import { Suspense } from 'react'
import { Await } from 'react-router'
import type { Route } from './+types/stream'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function loader(_args: Route.LoaderArgs) {
  const instant = { title: 'Quick Stats', count: 42 }

  const delayed = sleep(200).then(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Record ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
    })),
  )

  return { instant, delayed }
}

export default function StreamPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Streaming SSR Benchmark</h1>
      <section>
        <h2>{loaderData.instant.title}</h2>
        <p>Count: {loaderData.instant.count}</p>
      </section>
      <section>
        <Suspense fallback={<p>Loading records...</p>}>
          <Await resolve={loaderData.delayed}>
            {records => (
              <ul>
                {records.map(
                  (r: { id: number; name: string; value: number }) => (
                    <li key={r.id}>
                      {r.name}: {r.value}
                    </li>
                  ),
                )}
              </ul>
            )}
          </Await>
        </Suspense>
      </section>
    </div>
  )
}
