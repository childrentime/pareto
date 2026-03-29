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
| **[Error Boundaries](/concepts/error-handling/)** | `ParetoErrorBoundary` component for catching render errors |
| **[Redirect & 404](/concepts/redirects/)** | `throw redirect()` and `throw notFound()` in loaders |
| **[Resource Routes](/concepts/resource-routes/)** | `route.ts` files for JSON API endpoints |
| **[Head Management](/concepts/head-management/)** | Per-route `<title>` and meta tags via `head.tsx` |
| **Vite 7** | HMR, code splitting, tree shaking, React Fast Refresh |

## How It Works

1. **Request arrives** — Express routes to Pareto's request handler
2. **Loader runs** — `export function loader()` fetches data on the server
3. **SSR streams** — React renders to a stream, sending the shell immediately
4. **Deferred data streams in** — Promises wrapped in `defer()` resolve and stream to the client
5. **Client hydrates** — React takes over, enabling interactivity and client-side navigation

This architecture means your users see meaningful content fast (the shell renders immediately), while slower data loads progressively without blocking the initial paint. The loader pattern keeps data fetching on the server, so your components stay simple and your API keys stay secret.

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
