# Pareto

Lightweight React SSR framework with streaming, file-based routing, and built-in state management.

## Quick Start

```bash
npx create-pareto my-app
cd my-app
npm install
npm run dev
```

Or with pnpm:

```bash
pnpm create pareto my-app
```

## Features

- **SSR & Streaming** — Server-render pages instantly. Use `defer()` to stream slow data through Suspense boundaries.
- **File-Based Routing** — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `head.tsx`, `not-found.tsx` conventions.
- **SSG** — Export `config = { render: 'static' }` to pre-render pages at build time.
- **State Management** — Reactive stores powered by Immer. `defineStore()` with server/client serialization.
- **Error Boundaries** — `error.tsx` catches loader and render errors automatically.
- **Redirect & 404** — `throw redirect('/login')` and `throw notFound()` in loaders.
- **Resource Routes** — `route.ts` files return JSON directly (no HTML).
- **Head Management** — Per-route `<title>` and meta tags via `head.tsx`. Nested heads merge automatically.

## Project Structure

```
app/
  layout.tsx          # Root layout (wraps all pages)
  page.tsx            # Homepage (/)
  head.tsx            # Root head tags
  error.tsx           # Global error boundary
  not-found.tsx       # 404 page
  stream/
    page.tsx          # /stream
    head.tsx
  store/
    page.tsx          # /store
  api/time/
    route.ts          # /api/time (JSON endpoint)
```

## Loader & Streaming

```tsx
import { defer, useLoaderData, Await } from '@paretojs/core'

export function loader() {
  const stats = await db.getStats()
  return defer({
    stats,                        // available immediately
    feed: db.getFeed(),           // streams later
    comments: db.getComments(),   // streams later
  })
}

export default function Page() {
  const { stats, feed } = useLoaderData()
  return (
    <div>
      <h1>{stats.total} items</h1>
      <Await resolve={feed} fallback={<Skeleton />}>
        {(data) => <Feed items={data} />}
      </Await>
    </div>
  )
}
```

## State Management

```tsx
import { defineStore } from '@paretojs/core/store'

const counterStore = defineStore((set) => ({
  count: 0,
  increment: () => set((draft) => { draft.count++ }),
}))

// Use anywhere — supports direct destructuring
const { count, increment } = counterStore.useStore()
```

## Build & Deploy

```bash
pareto build    # Build for production
pareto start    # Start production server
```

## License

MIT
