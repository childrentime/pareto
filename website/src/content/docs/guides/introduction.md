---
title: Introduction
description: What Pareto is and why you might choose it over Next.js or Remix.
---

Pareto is a lightweight React SSR framework built on Vite 7. It gives you server-side rendering with streaming, file-based routing, and built-in state management — without the complexity of larger frameworks.

## Why Pareto?

If you've used Next.js or Remix, you already know the patterns. Pareto uses the same conventions — `page.tsx`, `layout.tsx`, `head.tsx` — but strips away the complexity:

- **No server components** — just regular React components with data loaders. Every component you write works on both server and client without special directives or `"use client"` annotations.
- **No framework lock-in** — standard Express server, standard Vite build. You can add any Express middleware, and your Vite plugins work as expected.
- **No config maze** — one [`pareto.config.ts`](/api/config/) file with sensible defaults. Most projects need zero configuration to get started.
- **Built-in state management** — [`defineStore()`](/concepts/state-management/) with Immer mutations, no extra dependencies. Supports direct destructuring, SSR serialization, and context-scoped stores.

## Feature Overview

| Feature | Description |
|---------|-------------|
| **[Streaming SSR](/concepts/streaming/)** | `defer()` + `<Await>` for progressive data loading |
| **[File-Based Routing](/concepts/routing/)** | `page.tsx`, `layout.tsx`, `loader.ts`, `head.tsx`, `not-found.tsx` |
| **[State Management](/concepts/state-management/)** | `defineStore()` with Immer — supports destructuring, SSR serialization |
| **[Error Handling](/concepts/error-handling/)** | `ParetoErrorBoundary` for component errors, `error.tsx` for app-level errors |
| **[Redirect & 404](/concepts/redirects/)** | `throw redirect()` and `throw notFound()` in loaders |
| **[Resource Routes](/concepts/resource-routes/)** | `route.ts` files for JSON API endpoints with `action` support |
| **[Head Management](/concepts/head-management/)** | Per-route `<title>` and meta tags via `head.tsx` with deduplication |
| **[Document Customization](/concepts/document-customization/)** | `document.tsx` with `getDocumentProps()` for `<html>` attributes |
| **Security Headers** | OWASP baseline headers applied automatically in production |
| **Vite 7** | HMR, code splitting, tree shaking, React Fast Refresh |

## How It Works

1. **Request arrives** — Express routes to Pareto's request handler
2. **Route matches** — File-based routes are matched against the URL, including dynamic and catch-all segments
3. **Loader runs** — `export function loader()` fetches data on the server. Loaders can `throw redirect()` or `throw notFound()`
4. **Head resolves** — `head.tsx` files from root to page are rendered, deduplicated, and merged
5. **SSR streams** — React renders to a stream via `renderToPipeableStream`, sending the HTML shell immediately
6. **Deferred data streams in** — Promises wrapped in `defer()` resolve and stream to the client via `<script>` tags that patch the hydration data
7. **Client hydrates** — `hydrateRoot` takes over with lazy-loaded page components. Subsequent navigations fetch data via `/__pareto/data` (JSON or NDJSON for deferred data)

This architecture means your users see meaningful content fast (the shell renders immediately), while slower data loads progressively without blocking the initial paint. The loader pattern keeps data fetching on the server, so your components stay simple and your API keys stay secret.

## Architecture Overview

Pareto's build and runtime are designed around three phases:

### Build Time

`pareto build` scans your `app/` directory to discover routes, then runs two Vite builds:

- **Client build** — produces code-split JS bundles with route-level lazy loading. Each `page.tsx` becomes a separate chunk loaded on demand. A Vite manifest maps routes to their JS/CSS assets.
- **Server build** — produces a single CJS bundle that statically imports all route modules and creates the Express request handler.

The build outputs a `RouteManifest` embedded in the client HTML, enabling the `<Link>` component to prefetch assets for any route before the user navigates.

### Server Runtime

Every request flows through `createRequestHandler`:

1. Match the URL against the route table (static → dynamic → catch-all priority)
2. Resource routes (`route.ts`) return JSON directly — no React rendering
3. Page routes run through the loader → head resolution → layout wrapping → `renderToPipeableStream` pipeline
4. Client-side navigations hit a dedicated `/__pareto/data` endpoint that returns loader data as JSON, or as NDJSON (newline-delimited JSON) when the loader uses `defer()` for streaming

### Client Runtime

`startClient` calls `hydrateRoot` and sets up the client router:

- **Initial load** — reads `window.__ROUTE_DATA__`, `__ROUTE_MANIFEST__`, and `__MATCHED_ROUTE__` from the SSR HTML
- **Navigation** — `<Link>` and `useRouter().push()` fetch route data from the server, update the router context, and swap in the new page component (loaded lazily)
- **Prefetching** — `<Link prefetch="hover">` (default) or `prefetch="viewport"` uses the route manifest to `modulepreload` JS/CSS chunks before navigation
- **Deferred data** — on initial SSR, deferred values stream in via `<script>` injections; on client navigation, they stream via NDJSON

## FAQ

### How is Pareto different from Next.js?

Next.js is a full-featured framework with server components, app router, edge runtime, and its own deployment platform (Vercel). Pareto is intentionally smaller in scope. It uses regular React components (no server components), runs on a standard Express server, and builds with Vite instead of Webpack/Turbopack. If you want a batteries-included platform, use Next.js. If you want a lightweight SSR framework where you control the server and build pipeline, Pareto is a better fit.

### Does Pareto support TypeScript?

Yes. Every Pareto project is TypeScript-first. The `create-pareto` scaffolding generates a TypeScript project with proper `tsconfig.json` settings, and all Pareto APIs export their types. Loader functions receive a typed [`LoaderContext`](/api/core/), and stores created with `defineStore()` infer their types automatically.

### Can I use my existing React components?

Yes. Pareto uses standard React 19 — any component that works in a regular React app works in Pareto. There are no special component types or directives. Your existing hooks, context providers, and third-party UI libraries all work without modification. The only Pareto-specific patterns are `loader` functions (which run on the server before rendering), convention files like `page.tsx` and `layout.tsx`, and optional components like `ParetoErrorBoundary`.

### What about React Server Components?

Pareto does not use React Server Components (RSC). Instead, it uses the loader pattern for server-side data fetching: you export a `loader()` function from your page file, and the data it returns is available to your components via `useLoaderData()`. This keeps a clear boundary between server logic (loaders) and client rendering (components), without the complexity of mixing server and client code in the same component tree.

### Can I deploy Pareto anywhere?

Yes. Pareto produces a standard Node.js server (Express). You can deploy it anywhere Node.js runs: a VPS, a Docker container, AWS EC2/ECS, Google Cloud Run, Railway, Fly.io, or any other hosting platform that supports Node.
