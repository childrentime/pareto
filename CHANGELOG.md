# Changelog

All notable changes to Pareto will be documented in this file.

## 4.0.0 (2026-03-31)

### Breaking Changes

- **`HeadDescriptor` / `HeadFunction` replaced by `head.tsx` component convention** — Head management is now done via React components in `head.tsx` files. Each route directory can have a `head.tsx` that exports a default component receiving `{ loaderData, params }`. Head components merge from root to page with automatic deduplication by `name`/`property`/`httpEquiv`.
- **`hydrateApp()` removed** — Use `startClient()` instead. The framework now handles hydration internally via the generated client entry.
- **`RouterProvider` no longer exported** — The router context is managed internally. Remove any manual `<RouterProvider>` usage.
- **`useRouterSnapshot()` removed** — Use `useRouter()` which now returns the router state directly.
- **`mergeHeadDescriptors()` removed** — Head merging is automatic via the `head.tsx` file convention.
- **`createStoreApi()` / `StateCreator` / `StoreApi` removed from main entry** — Use `defineStore()` or `defineContextStore()` from `@paretojs/core/store`.
- **`dehydrate()` / `getHydrationData()` / `hydrateStores()` removed** — Store hydration is now fully automatic.
- **`@paretojs/core/node` exports reduced** — `scanRoutes`, `matchRoute`, `loadConfig`, `resolveAppDir`, `resolveOutDir`, `loadEnv`, `loadApp`, `findAppFile`, `paretoVirtualEntry` are no longer public API.
- **`@paretojs/core/client` exports reduced** — Only `startClient` and `ClientRoute` type are exported. Use the main `@paretojs/core` entry for `Link`, `useRouter`, `useLoaderData`, etc.
- **Barrel files removed** — `router/index.ts`, `render/index.ts`, `entry/index.ts`, `data/index.ts`, `config/index.ts` are removed. Import directly from source modules.
- **`bin/start.js` removed** — Use `pareto start` CLI command.

### New Features

- **`app/document.tsx` convention** — Customize the HTML document shell. Export a `getDocumentProps(ctx: DocumentContext)` function to set `<html>` attributes (`lang`, `dir`, `className`, etc.) based on request context.
- **NDJSON streaming for client navigation** — Client-side navigations now receive loader data, head components, and deferred values via an NDJSON stream, replacing the previous JSON fetch approach. Enables progressive data delivery during navigation.
- **`wkWebViewFlushHint` config option** — Injects zero-width characters to force iOS WKWebView to paint the initial shell before the stream completes, avoiding white flash on skeleton/dashboard pages.
- **`startProductionServer()` exported from `@paretojs/core/node`** — Simplified production server startup. Handles static files, compression, and security headers.
- **`SECURITY_HEADERS` constant exported** — Access the raw security header map for custom server setups.
- **Default error fallback** — A built-in error fallback component is provided when no custom error boundary is defined.
- **Client-side head management** — Head components are loaded and rendered on the client during navigation, keeping `<title>` and `<meta>` tags in sync without full page reloads.
- **Route pattern caching** — Client-side route matching uses a pre-compiled regex cache for faster navigation.

### Improvements

- Simplified build pipeline — removed `copyDirSync` in favor of `fs.cpSync`
- Client route matching reuses server-side `pathToRegex` / `normalizePath` for consistency
- `<html>` element supports `suppressHydrationWarning` for dynamic attribute hydration
- Route scanner handles `not-found.tsx` convention for custom 404 pages
- Security headers module refactored with cleaner API surface

## 3.0.0 (2026-03-26)

### Breaking Changes

- **Vite 7 replaces Rspack** — The entire build system has been replaced. Remove any custom Rspack configuration and use `configureVite()` in `pareto.config.ts` instead.
- **React 19 required** — Minimum React version is now 19. Update `react` and `react-dom` to `^19.0.0`.
- **`error.tsx` convention removed** — Use the `ParetoErrorBoundary` component in your layouts and pages instead of `error.tsx` convention files.
- **`loading.tsx` convention removed** — Use React `<Suspense>` boundaries directly in your components.

### New Features

- **`loader.ts` convention file** — Define route loaders in a separate `loader.ts` file instead of exporting from `page.tsx`. Keeps data fetching logic separate from components.
- **`ParetoErrorBoundary` component** — Flexible error boundary that can be placed anywhere in the component tree. Import from `@paretojs/core`.
- **`securityHeaders()` middleware** — OWASP-recommended security headers out of the box. Import from `@paretojs/core/node`.
- **`configureVite()` config option** — Extend the Vite configuration for both client and server builds.
- **Immer-powered state management** — `defineStore()` and `defineContextStore()` now use Immer for immutable state updates.
- **`defineContextStore()`** — Context-scoped stores for per-request isolation, SSR-safe.
- **Store direct destructuring** — `const { count, increment } = store.useStore()` works out of the box.
- **Route groups** — `(groupName)` directories for shared layouts without URL segments.
- **Head merging** — `head.tsx` files merge from root to page, with deduplication by `name`/`property`.
- **`<Link>` prefetching** — Configurable prefetch strategies: `hover`, `viewport`, or `none`.
- **`useRouter()` hook** — Access router state and programmatic navigation (`push`, `replace`, `back`, `prefetch`).

### Improvements

- Dev server starts in milliseconds (Vite native ESM, no bundling in dev)
- React Fast Refresh with component state preservation
- Automatic SSR hydration for stores (no manual setup)
- Virtual module system for entry generation
- Comprehensive test suite (15 test files)

### Removed

- `@rspack/core` and all Rspack-related dependencies
- `@babel/core` and Babel configuration
- `loading.tsx` convention file
- `error.tsx` convention file
- `@paretojs/monitor` package

## 1.0.4 (2024)

- Custom page configuration support
- TypeScript migration for core package

## 1.0.2 (2024)

- Type exports fix
- Initial stable release
