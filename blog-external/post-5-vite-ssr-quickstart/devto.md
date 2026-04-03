---
title: "Build a Full-Stack React App with Vite SSR in 5 Minutes"
published: false
description: "From zero to a streaming React SSR app on Vite — file-based routing, loaders, state management, and production deployment in under 5 minutes."
tags: react, vite, javascript, tutorial
series:
canonical_url: https://paretojs.tech/blog/vite-ssr-quickstart/
cover_image:
---

Vite is the fastest dev server in the JavaScript ecosystem. But using it for SSR has always meant wiring up `renderToPipeableStream`, configuring client/server builds, and handling hydration yourself.

[Pareto](https://github.com/childrentime/pareto) is a React SSR framework built on Vite 7 that handles all of that. You get file-based routing, streaming SSR, loaders, state management, and a 62 KB client bundle — with zero config.

Let's build a full-stack React app in 5 minutes.

## 1. Create the project (30 seconds)

```bash
npx create-pareto@latest my-app
cd my-app
npm install
npm run dev
```

Open http://localhost:3000. You should see the default page. Edit `app/page.tsx` and watch it hot-reload instantly via Vite's HMR.

## 2. Understand the project structure (30 seconds)

```
my-app/
  app/
    layout.tsx        # Root layout (header, nav, footer)
    page.tsx          # Homepage (/)
    head.tsx          # Root <title> and meta tags
    not-found.tsx     # 404 page
    globals.css       # Global styles
  pareto.config.ts    # Framework config (optional)
  package.json
  tsconfig.json
```

Every directory inside `app/` with a `page.tsx` becomes a route. Nested directories create nested routes. That's it.

## 3. Build a page with server data (1 minute)

Create a new route at `/posts`:

```tsx
// app/posts/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  // This runs on the server only
  return {
    posts: [
      { id: 1, title: 'Hello World', body: 'First post' },
      { id: 2, title: 'Vite SSR', body: 'It is fast' },
    ],
  }
}
```

```tsx
// app/posts/page.tsx
import { useLoaderData } from '@paretojs/core'

interface Post {
  id: number
  title: string
  body: string
}

export default function PostsPage() {
  const { posts } = useLoaderData<{ posts: Post[] }>()

  return (
    <div>
      <h1>Posts</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

```tsx
// app/posts/head.tsx
export default function Head() {
  return (
    <>
      <title>Posts — My App</title>
      <meta name="description" content="All blog posts" />
    </>
  )
}
```

Navigate to http://localhost:3000/posts. The loader runs on the server, the HTML is server-rendered, and the page hydrates on the client. View source — the posts are in the HTML.

## 4. Add streaming for slow data (1 minute)

Real apps fetch from databases and APIs. Some are fast, some are slow. Use `defer()` to stream slow data without blocking the page:

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

async function getQuickStats() {
  return { users: 1_234, pageViews: 56_789 }
}

async function getSlowAnalytics() {
  // Simulate a slow API call
  await new Promise((r) => setTimeout(r, 2000))
  return { topPage: '/posts', bounceRate: 0.42 }
}

export async function loader() {
  const stats = await getQuickStats()  // resolve fast data first
  return defer({
    stats,                               // resolved — in initial HTML
    analytics: getSlowAnalytics(),       // Promise — streamed later
  })
}
```

```tsx
// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function DashboardPage() {
  const { stats, analytics } = useLoaderData()

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{stats.users} users · {stats.pageViews} page views</p>

      <Await resolve={analytics} fallback={<p>Loading analytics...</p>}>
        {(data) => (
          <div>
            <p>Top page: {data.topPage}</p>
            <p>Bounce rate: {(data.bounceRate * 100).toFixed(0)}%</p>
          </div>
        )}
      </Await>
    </div>
  )
}
```

Visit http://localhost:3000/dashboard. The stats appear immediately. The analytics section shows "Loading analytics..." then streams in after 2 seconds. The page never blocks.

## 5. Add client-side navigation (30 seconds)

Use `<Link>` for SPA-style navigation without full page reloads:

```tsx
// app/layout.tsx
import type { PropsWithChildren } from 'react'
import { Link } from '@paretojs/core'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/posts">Posts</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <main>{children}</main>
    </>
  )
}
```

Clicks navigate instantly. Loader data is fetched via NDJSON streaming — deferred data streams in progressively, just like the initial SSR render.

## 6. Add state management (30 seconds)

Pareto ships `defineStore()` with Immer — no extra dependencies:

```tsx
// app/stores/theme.ts
import { defineStore } from '@paretojs/core/store'

export const themeStore = defineStore((set) => ({
  mode: 'light' as 'light' | 'dark',
  toggle: () => set((d) => {
    d.mode = d.mode === 'light' ? 'dark' : 'light'
  }),
}))
```

```tsx
// Use in any component
import { themeStore } from '../stores/theme'

function ThemeToggle() {
  const { mode, toggle } = themeStore.useStore()
  return <button onClick={toggle}>Theme: {mode}</button>
}
```

State is automatically serialized during SSR and hydrated on the client. No boilerplate.

## 7. Add an API endpoint (30 seconds)

Create a `route.ts` file for JSON API endpoints:

```tsx
// app/api/time/route.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { time: new Date().toISOString() }
}
```

GET http://localhost:3000/api/time returns `{"time":"2026-04-03T..."}`. Standard REST endpoints, no extra setup.

## 8. Build and deploy (1 minute)

```bash
npm run build
npm run start
```

That's it. Your production server is a standard Node.js process running Express + Vite's optimized build. Deploy it anywhere you run Node: Docker, Fly.io, Railway, a VPS, Kubernetes.

No special hosting requirements. No serverless runtime compatibility issues. No vendor lock-in.

## What you just built

In 5 minutes, you have:

- **File-based routing** — directories map to routes
- **Server-side rendering** — full HTML on first load, great for SEO
- **Streaming SSR** — slow data doesn't block the page
- **Client navigation** — SPA-feel with NDJSON streaming
- **Head management** — per-route `<title>` and meta tags via React components
- **State management** — Immer-powered stores with automatic SSR hydration
- **API endpoints** — JSON routes alongside your pages
- **TypeScript** — full type safety across loaders and components
- **62 KB client bundle** — 73% smaller than Next.js

All powered by Vite 7 — instant dev server startup, React Fast Refresh, and native ESM in development.

## Why Vite for SSR?

| | Vite (Pareto) | Webpack (Next.js) | Turbopack (Next.js) |
|---|---|---|---|
| Dev server start | Instant (native ESM) | Seconds (bundling) | Fast (incremental) |
| HMR | React Fast Refresh | React Fast Refresh | React Fast Refresh |
| Plugin ecosystem | Vite/Rollup plugins | Webpack loaders | Limited |
| Config complexity | One `pareto.config.ts` | `next.config.js` + more | `next.config.js` + more |
| Build output | Optimized Rollup bundle | Webpack bundle | Webpack bundle |

Vite's native ESM dev server means zero bundling during development. Your 100-route app starts as fast as your 1-route app.

## Next steps

- [Routing docs](https://paretojs.tech/concepts/routing/) — dynamic routes, catch-all routes, nested layouts
- [Streaming SSR docs](https://paretojs.tech/concepts/streaming/) — when to use defer(), error handling
- [State management docs](https://paretojs.tech/concepts/state-management/) — defineStore, defineContextStore
- [Benchmarks](https://paretojs.tech/blog/benchmarks/) — Pareto vs Next.js vs React Router performance data

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
