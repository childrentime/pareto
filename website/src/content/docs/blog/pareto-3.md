---
title: Pareto 3.0
description: Pareto 3.0 is here — rebuilt on Vite 7, upgraded to React 19, with a streamlined API and better developer experience.
template: splash
---

Pareto 3.0 is a ground-up rebuild of the framework. The bundler, the runtime, the state management, and the CLI have all been rewritten. This is the release we've been working toward: a lightweight React SSR framework that feels fast to use and fast to ship.

## Vite 7 replaces Rspack

The biggest change in 3.0 is the build system. Pareto 2.x used Rspack (a Webpack-compatible bundler) with separate client and server configurations, Babel transforms, and a complex lazy compiler. All of that is gone.

Pareto 3.0 uses **Vite 7** as its build engine. This means:

- **Instant dev server startup** — Vite's on-demand module transform means the dev server is ready in milliseconds, not seconds.
- **Native ESM in development** — No bundling during dev. Modules are served directly to the browser.
- **React Fast Refresh** — HMR that preserves component state, powered by `@vitejs/plugin-react`.
- **Your Vite plugins work** — Any Vite plugin you already use (PostCSS, Tailwind, MDX, etc.) works out of the box. No framework-specific wrappers needed.
- **Single config surface** — Customize the build via `configureVite()` in `pareto.config.ts`. No more juggling separate Rspack configs for client and server.

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

## React 19

Pareto 3.0 requires **React 19**. This gives you access to the latest React features:

- **`use()` hook** — Read promises and context directly in render.
- **Actions** — Async functions that integrate with transitions.
- **`useOptimistic()`** — Optimistic UI updates built into React.
- **Improved Suspense** — Better streaming and hydration behavior.

No server components — Pareto continues to use the loader pattern for server-side data fetching. Your components are standard React components that work on both server and client.

## Simplified routing conventions

The file-based routing system has been refined. Convention files in 3.0:

| File | Purpose |
|------|---------|
| `page.tsx` | Route component |
| `layout.tsx` | Wrapping layout (nests from root to page) |
| `loader.ts` | Separate loader file for server-side data |
| `head.tsx` | Per-route `<title>` and meta tags |
| `not-found.tsx` | 404 page (root level only) |
| `route.ts` | Resource route (JSON API, no HTML) |

**New: `loader.ts`** — You can now define loaders in a separate file instead of exporting from `page.tsx`. This keeps data fetching logic separate from your components:

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

**Changed: Error handling** — Error handling is now done via the `ParetoErrorBoundary` component instead of `error.tsx` convention files. This gives you more flexibility — place error boundaries exactly where you need them in the component tree:

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

## State management improvements

`defineStore()` and `defineContextStore()` now use **Immer** for immutable state updates. Write mutations as if you're mutating directly — Immer produces the immutable result:

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: {
    increment(state) {
      state.count += 1  // Immer makes this immutable
    },
  },
})
```

The store API supports direct destructuring, SSR serialization via `dehydrate()` / `hydrateStores()`, and context-scoped stores for per-request isolation.

## Security headers

New `securityHeaders()` middleware provides OWASP-recommended security headers out of the box:

```ts
// pareto.config.ts
import { securityHeaders } from '@paretojs/core/node'
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  configureServer(app) {
    app.use(securityHeaders())
  },
}

export default config
```

This sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, and `Permissions-Policy` headers automatically.

## CLI changes

The CLI commands remain the same but are now built on `cac` instead of a custom parser:

```bash
pareto dev     # Development server with HMR
pareto build   # Production build (client + server + static)
pareto start   # Start production server
```

## Migration from 2.x

1. **Update dependencies** — Install `@paretojs/core@3` and update to React 19.
2. **Remove Rspack config** — Delete any custom Rspack configuration files. Use `configureVite()` in `pareto.config.ts` instead.
3. **Replace `error.tsx`** — Remove `error.tsx` files and use `ParetoErrorBoundary` in your layouts/pages instead.
4. **Update imports** — The `@paretojs/core` API surface is largely the same, but check that your imports match the [API reference](/api/core/).
5. **Test your loaders** — Loader behavior is unchanged, but verify that your data fetching works with Vite's dev server.

Try it now:

```bash
npx create-pareto@latest my-app
```
