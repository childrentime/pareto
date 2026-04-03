---
title: "Pareto 3.0: A Lightweight React SSR Framework, Rebuilt on Vite 7"
published: true
tags: react, javascript, ssr, webdev
series:
canonical_url: https://paretojs.tech/blog/pareto-3/
cover_image:
---

> TL;DR: Pareto 3.0 is a ground-up rewrite — Rspack replaced by Vite 7, React 19 required, simplified routing conventions, Immer-powered state management, and a new `ParetoErrorBoundary` component. Try it: `npx create-pareto@latest my-app`

---

If you've used Next.js or Remix, you know the React SSR patterns: file-based routing, layouts, loaders, streaming. Pareto gives you the same patterns without the complexity. No server components, no framework lock-in, no config maze.

Pareto 3.0 is the release where the framework caught up with the vision: **everything you need to build fast React apps, nothing you don't.**

## What changed in 3.0

### Vite 7 replaces Rspack

Pareto 2.x used Rspack with separate client/server configs, Babel, and a lazy compiler. All gone.

Pareto 3.0 uses **Vite 7**:

- **Instant dev server** — ready in milliseconds, not seconds
- **Native ESM** — no bundling during dev
- **React Fast Refresh** — HMR that preserves component state
- **Your Vite plugins work** — PostCSS, Tailwind, MDX, etc. No framework wrappers
- **One config** — `configureVite()` in `pareto.config.ts`

```ts
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  configureVite(config) {
    config.plugins.push(myVitePlugin())
    return config
  },
}

export default config
```

### React 19

Pareto 3.0 requires React 19. You get `use()`, Actions, `useOptimistic()`, and improved Suspense — but no server components. Pareto uses the loader pattern: your components are standard React that works on both server and client.

### Simplified routing

Convention files in 3.0:

| File | Purpose |
|------|---------|
| `page.tsx` | Route component |
| `layout.tsx` | Wrapping layout |
| `loader.ts` | Server-side data fetching (new!) |
| `head.tsx` | Per-route title and meta tags |
| `not-found.tsx` | 404 page |
| `route.ts` | JSON API endpoint |

**New: `loader.ts`** — Define loaders in a separate file. Keeps data fetching separate from components:

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

**Changed: Error handling** — `error.tsx` convention is gone. Use `ParetoErrorBoundary` instead — place it anywhere in the component tree:

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

### State management with Immer

`defineStore()` now uses Immer. Mutate directly, get immutable results:

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore((set) => ({
  count: 0,
  increment: () => set((d) => { d.count += 1 }),  // Immer makes this immutable
}))
```

Direct destructuring works: `const { count, increment } = counterStore.useStore()`. SSR serialization is automatic — no hydration code needed.

### Security headers

OWASP-recommended headers out of the box:

```ts
import { securityHeaders } from '@paretojs/core/node'

const config: ParetoConfig = {
  configureServer(app) {
    app.use(securityHeaders())
  },
}
```

## Streaming SSR — the killer feature

The reason Pareto exists. Send the page shell immediately, stream slow data as it resolves:

```tsx
import { defer, useLoaderData, Await } from '@paretojs/core'
import { Suspense } from 'react'

export function loader() {
  return defer({
    quickData: { total: 42 },           // sent immediately
    slowData: fetchFromDatabase(),       // streamed later
  })
}

export default function Page() {
  const { quickData, slowData } = useLoaderData()

  return (
    <div>
      <h1>{quickData.total} items</h1>
      <Suspense fallback={<Skeleton />}>
        <Await resolve={slowData}>
          {(data) => <DataTable rows={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

Users see content fast. Slow data loads progressively. No full-page spinners.

## Migration from 2.x

1. Install `@paretojs/core@3`, update to React 19
2. Remove Rspack config, use `configureVite()` instead
3. Replace `error.tsx` files with `ParetoErrorBoundary`
4. Test loaders with Vite's dev server

## Try it

```bash
npx create-pareto@latest my-app
cd my-app
npm install
npm run dev
```

Open `http://localhost:3000`. Edit `app/page.tsx`. Done.

---

*Pareto is a lightweight, streaming-first React SSR framework built on Vite. [GitHub](https://github.com/childrentime/pareto) · [Docs](https://paretojs.tech)*
