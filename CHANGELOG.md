# Changelog

All notable changes to Pareto will be documented in this file.

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
