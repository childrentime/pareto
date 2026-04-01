import type { LoaderContext } from '@paretojs/core'
import { useLoaderData } from '@paretojs/core'

interface DataResult {
  users: { id: number; name: string; email: string }[]
  meta: { total: number; page: number; timestamp: string }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function loader(_ctx: LoaderContext) {
  await sleep(10)

  return {
    users: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    })),
    meta: {
      total: 20,
      page: 1,
      timestamp: new Date().toISOString(),
    },
  } satisfies DataResult
}

export default function DataPage() {
  const data = useLoaderData<DataResult>()

  return (
    <div>
      <h1>Data Loading Benchmark</h1>
      <p>
        Total: {data.meta.total} | Page: {data.meta.page}
      </p>
      <ul>
        {data.users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
