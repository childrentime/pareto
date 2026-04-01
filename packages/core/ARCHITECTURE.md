# Pareto Architecture

This document describes the internal architecture of `@paretojs/core` — the runtime, build pipeline, and request lifecycle of the Pareto SSR framework.

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                      Build Time                          │
│                                                          │
│  scanRoutes() ──► Virtual Entry Plugin ──► Vite Build    │
│       │                    │                   │         │
│   filesystem           generates            outputs      │
│   walk appDir        server-entry.ts      ┌─────────┐   │
│                      client-entry.ts      │ client/  │   │
│                                           │ server/  │   │
│                                           │ manifest │   │
│                                           └─────────┘   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                     Request Time                         │
│                                                          │
│  Express ──► createRequestHandler ──► matchRoute         │
│                      │                    │              │
│                      │              ┌─────┴─────┐       │
│                      │              │           │       │
│                      │          resource    page route   │
│                      │          route.ts    page.tsx     │
│                      │              │           │       │
│                      │           JSON/     runLoaders    │
│                      │           action        │        │
│                      │                    resolveHead   │
│                      │                         │        │
│                      │                    React tree    │
│                      │                         │        │
│                      │              renderToPipeableStream│
│                      │                         │        │
│                      ▼                    stream HTML   │
│                 /__pareto/data                  │        │
│                 (client nav)              DeferredScript │
│                      │                   (stream data)  │
│                   JSON or                               │
│                   NDJSON                                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                      Client                              │
│                                                          │
│  hydrateRoot ──► RouterProvider ──► lazy(page)           │
│       │               │                                  │
│  reads globals   push/replace ──► fetch /__pareto/data   │
│  __ROUTE_DATA__       │               │                  │
│  __ROUTE_MANIFEST__   │          JSON or NDJSON          │
│  __MATCHED_ROUTE__    │               │                  │
│                  update context   merge deferred         │
│                       │                                  │
│                  RouteHead ──► dynamic head imports       │
└──────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── cli/                  # CLI commands (dev, build, start)
├── config/               # Config loading and Vite config generation
├── data/                 # Loader data context, streaming/deferred helpers
├── entry/                # Virtual entry code generation
├── head/                 # Head management (server resolve, client update, dedup)
├── ndjson/               # NDJSON streaming protocol (writer + reader)
├── plugins/              # Vite plugins (virtual entry)
├── render/               # SSR (server.tsx) and hydration (client.tsx)
├── router/               # Route scanner, matcher, context, useRouter
├── server/               # Production server, security headers
├── store/                # State management (defineStore, defineContextStore)
├── types.ts              # Shared type definitions
├── index.ts              # Public API (browser-safe exports)
├── node.ts               # Node/SSR API (server-only exports)
└── client.ts             # Client entry (startClient)
```

## Entry Points

Pareto ships three entry points, each scoped to a specific runtime:

| Entry | Import | Purpose |
|-------|--------|---------|
| `index.ts` | `@paretojs/core` | Browser-safe API: components (`Link`, `Await`, `ParetoErrorBoundary`), hooks (`useLoaderData`, `useRouter`, `useStreamData`), helpers (`defer`, `redirect`, `notFound`), types |
| `node.ts` | `@paretojs/core/node` | Server-only: `createRequestHandler`, `startProductionServer`, `securityHeaders` |
| `client.ts` | `@paretojs/core/client` | Client bundle entry: `startClient` (called by generated client entry) |
| `store/index.ts` | `@paretojs/core/store` | State management: `defineStore`, `defineContextStore` |

## Build Pipeline

### 1. Route Scanning (`router/route-scanner.ts`)

`scanRoutes(appDir)` walks the filesystem and builds a `RouteDef[]` array:

- `page.tsx` → creates a UI route at the corresponding URL path
- `route.ts` (without `page.tsx`) → creates a resource route (JSON/action, no HTML)
- `layout.tsx` → collected as ancestor layout chain for each route
- `loader.ts` → associated with its sibling `page.tsx`
- `head.tsx` → collected as ancestor head chain for each route
- `(groupName)/` → route group, omitted from URL
- `[param]/` → dynamic segment
- `[...slug]/` → catch-all segment
- `[[...optional]]/` → optional catch-all

Routes are sorted: static → dynamic → catch-all, then by segment count (more specific first).

### 2. Virtual Entry Generation (`entry/generate.ts` + `plugins/virtual-entry.ts`)

The Vite plugin `paretoVirtualEntry` provides two virtual modules:

**`virtual:pareto/server-entry`** — generates a module that:
- Statically imports all page, layout, loader, head, not-found, error, and document modules
- Builds a `moduleMap` (path → module) for `requireModule()`
- Constructs a `routes` array with metadata (path, component path, loader path, layout paths, head paths, params)
- Calls `createRequestHandler({ routes, requireModule, manifest, ... })`
- Exports the handler as the default export

**`virtual:pareto/client-entry`** — generates a module that:
- Uses `React.lazy(() => import(...))` for each page component (route-level code splitting)
- Eagerly imports layout components (shared across routes)
- Imports head modules as lazy loaders
- Calls `startClient(routes, { notFound, error })` to hydrate

In dev mode, the plugin watches `appDir` for file changes and invalidates virtual modules on route additions/removals, triggering Vite HMR full reload.

### 3. Vite Build (`cli/build.ts` + `config/vite.ts`)

`pareto build` runs two sequential Vite builds:

1. **Client build** — entry: `virtual:pareto/client-entry`, manifest generation enabled, hashed output to `outDir/client/assets/`
2. **Server build** — entry: `virtual:pareto/server-entry`, SSR mode, CJS output to `outDir/server/index.js`

After building, the CLI:
- Reads `.vite/manifest.json` to derive client entry URLs, global CSS URLs, and a per-route `RouteManifest` (JS/CSS chunk paths for each route)
- Copies `public/` to `outDir/static/`
- Writes `outDir/index.js` — the production server entry that calls `startProductionServer`

## Request Lifecycle

### Page Request Flow

```
Request (GET /blog/hello)
  │
  ├── matchRoute(pathname, routes)
  │     └── route = { path: '/blog/:slug', params: { slug: 'hello' }, ... }
  │
  ├── runLoaders(route, params, req, res, requireModule)
  │     ├── loader.ts export? → call loader({ req, res, params })
  │     ├── page.tsx loader export? → call page.loader(...)
  │     └── throw redirect() → 302 response
  │     └── throw notFound() → render not-found.tsx with 404
  │
  ├── resolveServerHead(route, loaderData, params, requireModule)
  │     └── walks head.tsx chain (root → page), deduplicates, marks with data-pareto-head
  │
  ├── Build React tree:
  │     Layout(root) → Layout(blog) → Suspense → Page
  │     wrapped in RouterProvider + LoaderDataContext
  │
  ├── Serialize hydration data:
  │     window.__ROUTE_DATA__ = { ... }
  │     window.__ROUTE_MANIFEST__ = { ... }
  │     window.__MATCHED_ROUTE__ = { path, params }
  │
  ├── Document component wraps everything:
  │     <html> + <head>(head + css + modulepreload) + <body>(#root + scripts)
  │
  └── renderToPipeableStream → stream to response
        ├── onShellReady → pipe(res) (first byte sent)
        ├── Suspense boundaries flush progressively
        └── DeferredScript components inject data as promises resolve
```

### Deferred/Streaming Data

When a loader returns `defer({ fast, slow: promise })`:

1. **SSR phase**: Resolved values go into `window.__ROUTE_DATA__` immediately. Pending promises get placeholder `DeferredScript` components inside Suspense boundaries.
2. **Stream phase**: As each promise resolves, `DeferredScript` injects a `<script>` that patches `window.__ROUTE_DATA__[key]` and dispatches a `pareto:deferred` custom event.
3. **Client phase**: `RouterProvider` listens for `pareto:deferred` events and merges resolved values into the loader data context, causing the `<Await>` component to re-render with the resolved data.

### Client Navigation (`/__pareto/data`)

When the user navigates client-side (via `<Link>` or `push()`):

1. Client calls `GET /__pareto/data?path=/blog/hello`
2. Server matches the route, runs loaders
3. If all data is synchronous → responds with JSON
4. If data includes deferred promises → responds with NDJSON (newline-delimited JSON):
   - First line: initial data with pending keys as `"__deferred__"` markers
   - Subsequent lines: `{ key, value }` as each promise resolves
5. Client reads the stream via `createNdjsonReader`, creating Promise placeholders that resolve as chunks arrive
6. `RouterProvider` updates context, triggering re-render

### Resource Routes

`route.ts` files (without a sibling `page.tsx`) handle raw requests:

- Default export or named `loader`/`action` → called with `LoaderContext`
- Return value sent as JSON with `Content-Type: application/json`
- Named `action` export handles non-GET methods (POST, PUT, DELETE, PATCH)

## Head Management

### Server (`head/server-head.ts`)

`resolveServerHead()` walks the route's `headPaths` array (root → leaf), renders each `Head` component with `{ loaderData, params }`, flattens fragments, deduplicates (later entries win for same `name`/`property`/`httpEquiv`, last `<title>` wins), and marks each element with `data-pareto-head` attribute.

### Client (`head/client-head.tsx`)

`RouteHead` dynamically imports head modules for the current route, deduplicates, and uses React 19's built-in `<head>` hoisting. An effect removes stale `[data-pareto-head]` nodes from the initial SSR render, preventing duplicates after hydration.

### Deduplication (`head/dedupe.ts`)

- `<title>` → last wins
- `<meta name="X">` → last with same `name` wins
- `<meta property="X">` → last with same `property` wins
- `<meta httpEquiv="X">` → last with same `httpEquiv` wins
- `<meta charset>` → last wins
- Everything else → kept as-is

## State Management

`defineStore(initializer)` creates a reactive store with Immer-powered mutations:

1. **SSR**: Store state is serialized into `window.__STORE_DATA__` during server render
2. **Client**: `hydrateRoot` reads serialized state to initialize stores, ensuring server/client consistency
3. **Runtime**: `useStore()` returns a proxy that triggers React re-renders on mutation via Immer's `produce()`
4. **Direct destructuring**: Unlike most state libraries, `const { count, increment } = store.useStore()` works correctly

`defineContextStore(initializer)` creates a context-scoped variant — each provider subtree gets its own store instance.

## NDJSON Protocol

The NDJSON (Newline-Delimited JSON) protocol is used for streaming deferred data during client-side navigation:

**Writer** (`ndjson/writer.ts`): Sets `Content-Type: application/x-ndjson`, provides `writeInitial(data)` for the first chunk and `writeChunk(key, value)` for subsequent deferred resolutions.

**Reader** (`ndjson/reader.ts`): Line-by-line parsing of `ReadableStream<Uint8Array>` in the browser. The first line is the initial data; subsequent lines contain `{ key, value }` pairs that resolve deferred promises.

## Production Server (`server/production.ts`)

`startProductionServer()`:
1. Loads `.env` files for the production environment
2. Creates an Express app (or uses a custom `app.ts` if present)
3. Applies security headers middleware (OWASP baseline)
4. Optionally enables compression
5. Serves static assets: `/assets/` with immutable cache headers, client files, and `static/` directory
6. Mounts the SSR request handler
7. Listens on `PORT` (default 3000) with graceful SIGTERM/SIGINT shutdown

### Security Headers (`server/security-headers.ts`)

Default headers include: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy` with a conservative default policy.

## Dev Server (`cli/dev.ts`)

`pareto dev`:
1. Loads config, finds a free port
2. Optionally loads a custom `app.ts` Express application
3. Creates a shared HTTP server
4. Starts Vite in middleware mode (HMR, React Fast Refresh)
5. Mounts Vite middleware, static files, and a catch-all SSR handler
6. The catch-all uses `vite.ssrLoadModule('virtual:pareto/server-entry')` — every request gets hot-reloaded server code without restart

## Document Customization

Users can create `app/document.tsx` to customize the HTML document:

```tsx
export function getDocumentProps({ req, params, pathname, loaderData }) {
  return {
    lang: 'en',
    className: 'dark',
    'data-theme': 'dark',
  }
}
```

The returned attributes are applied to `<html>` during SSR and synced on client navigation via `applyHtmlAttributes()`.

## Route Manifest

The `RouteManifest` maps route paths to their client-side assets:

```ts
interface RouteManifest {
  routes: Record<string, RouteManifestEntry>
}

interface RouteManifestEntry {
  js: string[]    // JS chunk URLs for this route
  css: string[]   // CSS chunk URLs for this route
}
```

This powers:
- `<Link prefetch="hover">` — preloads route JS/CSS on hover
- `<Link prefetch="viewport">` — preloads when the link enters the viewport
- `modulepreload` hints in the initial HTML for the matched route
