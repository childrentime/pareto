---
title: Quick Start
description: Create your first Pareto app in 5 minutes.
---

## Create a new project

```bash
npx create-pareto@latest my-app
cd my-app
npm install
```

## Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` and the page updates instantly via HMR.

## Project structure

```
my-app/
  app/
    layout.tsx        # Root layout (header, nav, footer)
    page.tsx          # Homepage (/)
    head.tsx          # Root meta tags
    not-found.tsx     # 404 page
    globals.css       # Global styles (Tailwind)
    stream/
      page.tsx        # /stream route
      head.tsx        # Per-route meta tags
    api/time/
      route.ts        # /api/time (JSON endpoint)
  package.json
  tsconfig.json
  tailwind.config.js
```

## Your first page

Every `page.tsx` inside `app/` becomes a route:

```tsx
// app/page.tsx
import { useLoaderData } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return { message: 'Hello from the server!' }
}

export default function HomePage() {
  const data = useLoaderData<{ message: string }>()
  return <h1>{data.message}</h1>
}
```

## Adding a layout

`layout.tsx` wraps all pages at the same level and below:

```tsx
// app/layout.tsx
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header>My App</header>
      <main>{children}</main>
    </>
  )
}
```

## Build for production

```bash
npm run build   # Build
npm run start   # Start production server
```

## Next steps

Now that your app is running, explore the core concepts:

- **[File-Based Routing](/concepts/routing/)** — Learn the conventions for `page.tsx`, `layout.tsx`, `loader.ts`, dynamic routes, and catch-all routes.
- **[Streaming SSR](/concepts/streaming/)** — Use `defer()` and `<Await>` to stream slow data without blocking the initial page load.
- **[State Management](/concepts/state-management/)** — Manage global and per-request state with `defineStore()` and `defineContextStore()`.
- **[Head Management](/concepts/head-management/)** — Set per-route `<title>` and meta tags via `head.tsx`.
- **[Error Handling](/concepts/error-handling/)** — Use `ParetoErrorBoundary` to catch render errors in your layouts and pages.
- **[Static Site Generation](/concepts/ssg/)** — Pre-render pages at build time with `render: 'static'`.
- **[Resource Routes](/concepts/resource-routes/)** — Create JSON API endpoints with `route.ts`.
- **[Configuration](/api/config/)** — Customize the Express server, Vite build, and CLI options via `pareto.config.ts`.
