---
title: Pareto 4.0
description: Pareto 4.0 — NDJSON streaming navigation, head.tsx component convention, document customization, and 9x faster data loading than Next.js.
template: splash
---

<p class="blog-meta">By <a href="https://github.com/childrentime">childrentime</a> · March 31, 2026</p>

Pareto 4.0 is about two things: making client navigation as fast as the initial SSR render, and proving it with numbers.

The headline features are NDJSON streaming for navigations, a React component convention for `<head>`, and document-level customization. But the real story is that we now have [automated benchmarks](/blog/benchmarks/) running in CI — and Pareto handles **9.3x more data-loading requests than Next.js** and sustains **6.5x higher streaming throughput** under load.

## NDJSON streaming navigation

In 3.0, client-side navigations fetched loader data as a single JSON response. The browser waited for the entire payload before rendering. In 4.0, navigations use **NDJSON (newline-delimited JSON) streaming**.

When you navigate to a page with `defer()`, the client receives the non-deferred data immediately and starts rendering. Deferred values stream in as they resolve — the same progressive delivery model as the initial SSR render, now applied to every client navigation.

This means Suspense boundaries work identically on first load and on navigation. No behavioral differences, no special handling.

## `head.tsx` component convention

Head management is no longer a descriptor object. It's a React component.

Each route directory can have a `head.tsx` that exports a default component receiving `{ loaderData, params }`:

```tsx
// app/dashboard/head.tsx
export default function Head({ loaderData }: { loaderData: { title: string } }) {
  return (
    <>
      <title>{loaderData.title} — Dashboard</title>
      <meta name="description" content={`Dashboard for ${loaderData.title}`} />
    </>
  )
}
```

Head components merge from root layout to page. Duplicate tags are deduplicated by `name`, `property`, or `httpEquiv` — the deepest route wins. During client navigation, head components re-render to keep `<title>` and `<meta>` in sync without a full page reload.

## Document customization

A new `document.tsx` convention lets you customize the HTML shell:

```tsx
// app/document.tsx
import type { DocumentContext } from '@paretojs/core'

export function getDocumentProps(ctx: DocumentContext) {
  const lang = ctx.url.startsWith('/zh') ? 'zh-CN' : 'en'
  return { lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }
}
```

The returned props are applied to the `<html>` element. This is useful for i18n, RTL support, or any per-request HTML attributes.

## Performance: the numbers

We built a comprehensive benchmark suite that runs in CI on every PR. The results speak for themselves.

**Throughput** (100 connections, 30s duration):

- Data Loading: Pareto **2,733/s** vs Next.js 293/s (**9.3x**)
- API / JSON: Pareto **3,675/s** vs Next.js 2,212/s (**1.7x**)
- Streaming SSR: Pareto **247/s**, roughly equal across frameworks

**Max sustainable QPS** (1→1,000 connections, p99 < 500ms):

- Streaming SSR: Pareto **2,022/s** vs Next.js 310/s (**6.5x**)
- Data Loading: Pareto **2,735/s** vs Next.js 331/s (**8.3x**)

In concrete terms: if your data-loading pages need to handle 2,000 req/s at peak, that's 1 Pareto server vs 6 Next.js instances. For streaming SSR dashboards, it's 1 vs 7. Less infrastructure, less cost, fewer things to break.

**Client JS bundle**: 62 KB gzipped — roughly 1/4 of Next.js (233 KB). On 4G mobile, that's ~100ms to download vs ~370ms. Every millisecond counts for bounce rate.

Full details in our [benchmark blog post](/blog/benchmarks/).

## Other changes in 4.0

- **`startProductionServer()`** — New export from `@paretojs/core/node` for simplified production server startup with built-in static file serving, compression, and security headers.
- **Default error fallback** — A built-in error fallback component when no custom error boundary is defined.
- **Route pattern caching** — Client-side route matching uses a pre-compiled regex cache for faster navigation.
- **`wkWebViewFlushHint`** — Config option to force iOS WKWebView to paint the initial shell before the stream completes.

## Breaking changes

- `HeadDescriptor` / `HeadFunction` replaced by `head.tsx` components
- `hydrateApp()` removed — use `startClient()`
- `RouterProvider` no longer exported — managed internally
- `createStoreApi()` removed — use `defineStore()` from `@paretojs/core/store`
- `dehydrate()` / `getHydrationData()` / `hydrateStores()` removed — hydration is automatic
- Barrel files removed — import directly from source modules

See the full [changelog](https://github.com/childrentime/pareto/blob/main/CHANGELOG.md) for migration details.

## Try it

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
