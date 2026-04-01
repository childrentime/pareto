import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const getUsers = createServerFn({ method: 'GET' }).handler(async () => {
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
  }
})

export const Route = createFileRoute('/data')({
  loader: () => getUsers(),
  component: DataPage,
})

function DataPage() {
  const data = Route.useLoaderData()

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
