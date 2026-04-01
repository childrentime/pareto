import type { LoaderContext } from '@paretojs/core'
import { Await, defer, useLoaderData } from '@paretojs/core'

interface StreamData {
  instant: { title: string; count: number }
  delayed: Promise<{ id: number; name: string; value: number }[]>
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function loader(_ctx: LoaderContext) {
  const instant = { title: 'Quick Stats', count: 42 }

  const delayed = sleep(200).then(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Record ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
    })),
  )

  return defer({ instant, delayed })
}

export default function StreamPage() {
  const data = useLoaderData<StreamData>()

  return (
    <div>
      <h1>Streaming SSR Benchmark</h1>
      <section>
        <h2>{data.instant.title}</h2>
        <p>Count: {data.instant.count}</p>
      </section>
      <section>
        <Await resolve={data.delayed} fallback={<p>Loading records...</p>}>
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
      </section>
    </div>
  )
}
