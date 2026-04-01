import { createFileRoute } from '@tanstack/react-router'

const items = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  title: `Item ${i + 1}`,
  description: `Description for item ${i + 1}`,
}))

export const Route = createFileRoute('/')({
  component: StaticPage,
})

function StaticPage() {
  return (
    <div>
      <h1>Static SSR Benchmark</h1>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
