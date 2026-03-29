# Pareto

Lightweight React SSR framework built on Vite — streaming, file-based routing, client-side navigation, and built-in state management.

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
- **File-Based Routing** — `page.tsx`, `layout.tsx`, `loader.ts`, `head.tsx`, `not-found.tsx` conventions.
- **Dynamic Routes** — `[param]`, `[...slug]`, `[[...optional]]` segments for dynamic URL matching.
- **Route Groups** — `(groupName)` directories to organize routes without affecting the URL.
- **Client-Side Navigation** — `<Link>` component and `useRouter()` hook for SPA-style navigation with prefetching.
- **State Management** — Reactive stores powered by Immer. `defineStore()` and `defineContextStore()` with SSR hydration.
- **Head Management** — Per-route `<title>` and meta tags via `head.tsx`. Nested heads merge automatically.
- **Resource Routes** — `route.ts` files return JSON directly (no HTML rendering).
- **Redirect & 404** — `throw redirect('/login')` and `throw notFound()` in loaders.
- **Security Headers** — Built-in OWASP baseline security headers middleware.
- **Environment Variables** — `.env` / `.env.local` / `.env.{mode}` support out of the box.

## Project Structure

```
app/
  layout.tsx          # Root layout (wraps all pages)
  page.tsx            # Homepage (/)
  head.tsx            # Root head tags
  not-found.tsx       # 404 page
  blog/
    layout.tsx        # Blog layout (nests inside root)
    page.tsx          # /blog
    head.tsx          # Blog head tags
    [slug]/
      page.tsx        # /blog/:slug
      loader.ts       # Data loader for blog post
      head.tsx        # Dynamic head tags
  (auth)/
    login/
      page.tsx        # /login (group doesn't add URL segment)
  api/time/
    route.ts          # /api/time (JSON endpoint)
```

### Route File Conventions

| File | Purpose |
|---|---|
| `page.tsx` | Page component — makes a directory a route |
| `layout.tsx` | Layout wrapper — nests around child routes |
| `loader.ts` | Server-side data loader |
| `head.tsx` | `<title>` and `<meta>` tags for the route |
| `route.ts` | Resource route — returns raw data (no HTML) |
| `not-found.tsx` | 404 page (app root only) |

## Loader & Streaming

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

export async function loader({ req, params }) {
  const stats = await db.getStats()
  return defer({
    stats,                        // available immediately
    feed: db.getFeed(),           // streams later
    comments: db.getComments(),   // streams later
  })
}

// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

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

## Client-Side Navigation

```tsx
import { Link, useRouter } from '@paretojs/core'

// Declarative navigation with prefetching
<Link href="/about">About</Link>
<Link href="/blog/hello" prefetch="viewport">Read Post</Link>
<Link href="/login" replace>Login</Link>

// Programmatic navigation
function MyComponent() {
  const { push, replace, back, pathname, isNavigating, prefetch } = useRouter()
  return <button onClick={() => push('/dashboard')}>Go</button>
}
```

Prefetch strategies: `hover` (default), `viewport`, `none`.

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

Stores are automatically serialized during SSR and hydrated on the client.

## Head Management

```tsx
// app/blog/[slug]/head.tsx
import type { HeadFunction } from '@paretojs/core'

export const head: HeadFunction = ({ loaderData, params }) => ({
  title: loaderData.post.title,
  meta: [
    { name: 'description', content: loaderData.post.summary },
    { property: 'og:title', content: loaderData.post.title },
  ],
})
```

Nested `head.tsx` files merge automatically — child values override parent values.

## Configuration

```ts
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

export default {
  appDir: 'app',        // default: 'app'
  outDir: '.pareto',    // default: '.pareto'
  configureVite: (config, { isServer }) => ({
    ...config,
    // Custom Vite configuration
  }),
} satisfies ParetoConfig
```

## CLI

```bash
pareto dev      # Start dev server with HMR
pareto build    # Build for production (client + server)
pareto start    # Start production server
```

## License

MIT
