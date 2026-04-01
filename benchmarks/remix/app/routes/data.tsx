import type { Route } from './+types/data'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function loader(_args: Route.LoaderArgs) {
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
}

export default function DataPage({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      <h1>Data Loading Benchmark</h1>
      <p>
        Total: {loaderData.meta.total} | Page: {loaderData.meta.page}
      </p>
      <ul>
        {loaderData.users.map(user => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
