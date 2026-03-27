---
title: File-Based Routing
description: How Pareto maps your file system to URL routes.
---

Pareto uses file-based routing. Every `page.tsx` inside `app/` becomes a route. The file system is the router — no separate route configuration file needed.

## What are the convention files?

Each directory in your `app/` folder can contain special convention files that control how that route behaves:

| File | Purpose |
|------|---------|
| `page.tsx` | Route component — renders the page content |
| `layout.tsx` | Wrapping layout (nests from root to page) |
| `loader.ts` | Separate loader file for server-side data fetching |
| `head.tsx` | Per-route [`<title>` and meta tags](/concepts/head-management/) |
| `not-found.tsx` | 404 page (root level only) |
| `route.ts` | [Resource route](/concepts/resource-routes/) (JSON API, no HTML) |

## How does file-to-URL mapping work?

```
app/
  page.tsx              → /
  stream/
    page.tsx            → /stream
  blog/
    [slug]/
      page.tsx          → /blog/:slug
  api/
    users/
      route.ts          → /api/users (JSON)
```

## How do I create dynamic routes?

Use `[param]` directory names for dynamic segments:

```
app/blog/[slug]/page.tsx  → /blog/:slug
```

Access params via the loader context:

```tsx
export function loader(ctx: LoaderContext) {
  const { slug } = ctx.params
  return { post: getPost(slug) }
}
```

Dynamic routes match any value for that segment. The param name inside the brackets becomes the key in `ctx.params`.

## How do catch-all routes work?

Use `[...param]` for catch-all segments:

```
app/docs/[...path]/page.tsx  → /docs/*
```

The `path` param will be a string containing the rest of the URL. For example, `/docs/getting-started/install` sets `ctx.params.path` to `getting-started/install`.

### Optional catch-all routes

Use `[[...param]]` (double brackets) for optional catch-all segments. These work like catch-all routes but also match the parent path:

```
app/docs/[[...path]]/page.tsx  → /docs and /docs/*
```

This matches both `/docs` (with `ctx.params.path` undefined) and `/docs/getting-started` (with `ctx.params.path` set to `getting-started`).

## How do nested layouts work?

Layouts at each level wrap their children. A root `layout.tsx` wraps every page:

```
app/
  layout.tsx            ← wraps everything
  page.tsx              ← / (wrapped by root layout)
  dashboard/
    layout.tsx          ← wraps dashboard pages
    page.tsx            ← /dashboard (wrapped by both layouts)
    settings/
      page.tsx          ← /dashboard/settings (wrapped by both layouts)
```

Nested layouts are useful for sections of your app that share a common UI shell. For example, a dashboard section might have a sidebar navigation that only appears on dashboard pages.

## Can I define loaders in a separate file?

You can define a route's loader in a separate `loader.ts` file instead of exporting it from `page.tsx`:

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

This keeps your data fetching logic separate from your components, which is useful for complex loaders with many imports. If both `loader.ts` and a `loader` export in `page.tsx` exist, `loader.ts` takes precedence.

## What are route groups?

If you want to share a layout between routes without adding a URL segment, use parenthesized directory names:

```
app/
  (marketing)/
    layout.tsx          ← shared layout for marketing pages
    page.tsx            ← / (no /marketing prefix)
    about/
      page.tsx          ← /about
  (dashboard)/
    layout.tsx          ← shared layout for dashboard pages
    overview/
      page.tsx          ← /overview
```

Directories wrapped in parentheses `()` are route groups. They affect layout nesting but do not appear in the URL.

## Per-route metadata

Each route can define its own `<title>` and meta tags via a `head.tsx` file. See [Head Management](/concepts/head-management/) for details on how head descriptors merge from root to page.

## Error handling

Use [`ParetoErrorBoundary`](/concepts/error-handling/) in your layouts or pages to catch render errors. You can place error boundaries at any level for fine-grained error isolation.
