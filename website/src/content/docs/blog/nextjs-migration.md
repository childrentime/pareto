---
title: "From Next.js to Pareto: What Changes and What Stays the Same"
description: A practical migration guide for Next.js developers moving to Pareto — the lightweight, streaming-first React SSR framework on Vite.
template: splash
---

<p class="blog-meta">By <a href="https://github.com/childrentime">childrentime</a> · April 3, 2026</p>

You know Next.js. You know file-based routing, layouts, loaders, SSR. You probably also know the pain: server components vs client components, the `"use client"` dance, mysterious hydration errors, and a 233 KB client bundle before you write a single line of app code.

Pareto gives you the same SSR patterns — but without the complexity. Standard React components, Vite instead of Webpack/Turbopack, and a 62 KB client bundle. This post walks through exactly what changes when you move from Next.js to Pareto, and what stays familiar.

## The mental model shift

**Next.js (App Router):** Every component is a server component by default. Want `useState`? Add `"use client"`. Data fetching happens via `async` server components or route-level `generateMetadata`. You're constantly thinking about the server/client boundary.

**Pareto:** Every component is a regular React component that runs on both server and client. Data fetching happens in `loader.ts` files — a pattern borrowed from Remix. There's no `"use client"` directive because there's no server component / client component split.

```
Next.js mental model:  "Is this a server component or a client component?"
Pareto mental model:   "Is this data or UI?"
```

## Routing: almost identical

If you know Next.js App Router conventions, Pareto's routing is immediately familiar:

| Next.js | Pareto | Purpose |
|---------|--------|---------|
| `page.tsx` | `page.tsx` | Route component |
| `layout.tsx` | `layout.tsx` | Wrapping layout |
| — | `loader.ts` | Server-side data |
| `loading.tsx` | Suspense + `<Await>` | Loading states |
| `error.tsx` | `ParetoErrorBoundary` | Error handling |
| `not-found.tsx` | `not-found.tsx` | 404 page |
| `route.ts` | `route.ts` | API endpoint |
| `head.tsx` / `generateMetadata` | `head.tsx` | Meta tags |

The biggest difference: Pareto uses a dedicated `loader.ts` file for data fetching instead of making the page component async.

## Data fetching: loaders replace async components

**Next.js (App Router):**

```tsx
// app/dashboard/page.tsx (server component)
export default async function Dashboard() {
  const stats = await db.getStats()
  return <h1>{stats.total} users</h1>
}
```

**Pareto:**

```tsx
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: db.getStats() }
}

// app/dashboard/page.tsx
import { useLoaderData } from '@paretojs/core'

export default function Dashboard() {
  const { stats } = useLoaderData<{ stats: { total: number } }>()
  return <h1>{stats.total} users</h1>
}
```

Two files instead of one, but the separation is intentional: data fetching is explicit, testable, and never mixed with rendering logic. The component is standard React — no `async`, no `await`, no server-only constraints.

## Streaming: `defer()` instead of Suspense gymnastics

**Next.js:** Streaming requires splitting your page into server and client components, coordinating `loading.tsx` boundaries, and understanding which components block the initial render.

**Pareto:** Call `defer()` in your loader. Wrap slow data in `<Await>`. Done.

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

export async function loader() {
  const userCount = await getUserCount()  // resolve fast data first

  return defer({
    userCount,                             // resolved — sent immediately
    activityFeed: getActivityFeed(),       // slow — streamed later
    analytics: getAnalytics(),             // slower — streamed even later
  })
}

// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function Dashboard() {
  const { userCount, activityFeed, analytics } = useLoaderData()

  return (
    <div>
      <h1>{userCount} users</h1>

      <Await resolve={activityFeed} fallback={<Skeleton />}>
        {(feed) => <ActivityList items={feed} />}
      </Await>

      <Await resolve={analytics} fallback={<ChartSkeleton />}>
        {(data) => <AnalyticsChart data={data} />}
      </Await>
    </div>
  )
}
```

Each `<Await>` creates its own Suspense boundary. Fast data renders immediately. Slow data streams in progressively. Same behavior on initial SSR load and client-side navigation (via NDJSON streaming in Pareto 4.0).

## Head management: React components, not config objects

**Next.js:**

```tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.id)
  return { title: post.title, description: post.excerpt }
}
```

**Pareto:**

```tsx
// app/blog/[id]/head.tsx
export default function Head({ loaderData }: { loaderData: { post: Post } }) {
  return (
    <>
      <title>{loaderData.post.title}</title>
      <meta name="description" content={loaderData.post.excerpt} />
      <meta property="og:title" content={loaderData.post.title} />
    </>
  )
}
```

It's a React component. You can use conditional logic, compose from shared components, or render anything valid in `<head>`. Head components merge from root layout to page — the deepest route wins for duplicate tags.

## State management: built-in, not bolted on

Next.js has no opinion on state management. You bring your own Redux, Zustand, Jotai, etc., and figure out SSR hydration yourself.

Pareto ships `defineStore()` with Immer:

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore((set) => ({
  items: [] as CartItem[],
  total: 0,
  addItem: (item: CartItem) => set((d) => {
    d.items.push(item)
    d.total += item.price
  }),
}))
```

SSR hydration is automatic. State defined on the server is serialized and restored on the client without any manual `dehydrate` / `rehydrate` boilerplate.

## Configuration: use Vite directly

**Next.js:** `next.config.js` for framework config + separate Webpack/Turbopack customization + potential `middleware.ts` + environment variable conventions.

**Pareto:** Pareto uses Vite natively, so there's no framework-specific config wrapper. Drop a standard `vite.config.ts` in your project root — Pareto loads and merges it automatically in both dev and build modes.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: { '@': '/src' },
  },
  ssr: {
    noExternal: ['some-esm-only-pkg'],
  },
})
```

For Pareto-specific options (`appDir`, `outDir`, etc.) add a tiny `pareto.config.ts`:

```ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  appDir: 'app',
}

export default config
```

No framework magic. It's Vite under the hood, fully accessible — every Vite plugin works out of the box.

## The performance difference

We run automated benchmarks in CI comparing Pareto against Next.js on identical hardware:

- **Data loading throughput:** Pareto 2,733 req/s vs Next.js 293 req/s (**9.3x**)
- **Streaming SSR capacity:** Pareto 2,022 req/s vs Next.js 310 req/s (**6.5x**)
- **Client JS bundle:** 62 KB vs 233 KB (**73% smaller**)

In infrastructure terms: a page serving 2,000 req/s needs 1 Pareto server vs 6 Next.js instances. Full benchmark details: [/blog/benchmarks/](/blog/benchmarks/)

## What you give up

Transparency matters. Here's what Pareto doesn't have:

- **Server components** — No RSC, no `"use client"`. This is by design: the loader pattern is simpler and covers 95% of use cases.
- **Image optimization** — No `<Image>` component with automatic resizing. Use standard `<img>` with a CDN.
- **ISR / Static generation** — Pareto is SSR-only. No `generateStaticParams()`, no build-time rendering. If you need static pages, pair with a static site generator.
- **Middleware** — No edge middleware concept. Create a custom `app.ts` at your project root and add Express middleware there instead.
- **Vercel integration** — No one-click deploy. You deploy a standard Node.js server.
- **Ecosystem size** — Smaller community, fewer examples. You're early.

If you're building a content-heavy marketing site with ISR, Next.js is still the right call. If you're building a data-driven app where performance and simplicity matter, Pareto is worth the switch.

## Migration checklist

1. `npx create-pareto@latest my-app` — scaffold a new project
2. Move your routes from `app/` — file structure is nearly identical
3. Extract `async` server components into `loader.ts` + standard component
4. Replace `"use client"` directives — they're not needed, just delete them
5. Move `generateMetadata` to `head.tsx` components
6. Replace `loading.tsx` with `defer()` + `<Await>` for streaming
7. Replace `next/link` with `Link` from `@paretojs/core`
8. Move Webpack/Turbopack config to a standard `vite.config.ts`
9. Deploy as a standard Node.js server

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

<style>
{`
  .blog-meta {
    font-size: 0.875rem;
    color: var(--sl-color-gray-3);
    margin-bottom: 2rem;
  }
  .blog-meta a {
    color: var(--sl-color-accent);
  }
`}
</style>
