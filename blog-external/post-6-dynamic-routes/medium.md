# Dynamic Routes in Pareto: [slug], Catch-All, and Nested Layouts

File-based routing is one of those features that feels trivial until you try to build something non-trivial with it. Dynamic blog slugs, multi-level doc paths, tenant dashboards with shared sidebars, marketing pages that share a layout but not a URL prefix — every real app needs all of these, and every router handles them slightly differently.

This post walks through every routing pattern [Pareto](https://github.com/childrentime/pareto) supports, with examples you can copy directly into your `app/` folder.

## The mental model

In Pareto, the file system **is** the router. Every directory under `app/` that contains a `page.tsx` becomes a URL. There's no separate route config, no `routes.ts` registry, no code generation step. You move a file — the URL changes. You rename a directory — the URL changes.

The whole convention set:

| File | What it does |
|------|--------------|
| `page.tsx` | Renders the page |
| `layout.tsx` | Wraps child pages |
| `loader.ts` | Server-side data fetching |
| `head.tsx` | `<title>`, meta tags |
| `not-found.tsx` | 404 page (root only) |
| `error.tsx` | Error page (root only) |
| `document.tsx` | `<html>` customization (root only) |
| `route.ts` | JSON API endpoint |

Everything else is just colocated components, utilities, or stylesheets that Pareto ignores.

## Static routes

```
app/
  page.tsx              → /
  about/
    page.tsx            → /about
  pricing/
    page.tsx            → /pricing
```

Directory names become URL segments, one-to-one. Capitalization matters — `app/About/page.tsx` produces `/About`, not `/about`. Stick to lowercase.

## Dynamic segments: [param]

Most real apps have at least one page that takes a dynamic parameter — a blog slug, a product ID, a username. Wrap the segment in brackets:

```
app/blog/[slug]/page.tsx  → /blog/:slug
```

This route matches `/blog/hello-world`, `/blog/pareto-4`, `/blog/anything-at-all`. You access the value through `ctx.params`:

```ts
// app/blog/[slug]/loader.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const { slug } = ctx.params
  const post = await db.post.findUnique({ where: { slug } })

  if (!post) {
    throw new Response('Not found', { status: 404 })
  }

  return { post }
}
```

The param key inside the brackets is the key on `ctx.params`. Name it `[slug]`, get `params.slug`. There's no magic mapping.

You can combine multiple dynamic segments:

```
app/users/[userId]/posts/[postId]/page.tsx  → /users/:userId/posts/:postId
```

Both params show up in `ctx.params`:

```ts
const { userId, postId } = ctx.params
```

## Catch-all routes: [...param]

Sometimes you don't know how deep a path will go. A docs site might have `/docs/getting-started`, `/docs/api/core/loader`, `/docs/guides/deployment/docker/rootless`. Writing a folder for every depth is absurd. Use a catch-all:

```
app/docs/[...path]/page.tsx  → /docs/*
```

`ctx.params.path` contains everything after `/docs/` as a single string with slashes preserved:

```
// /docs/getting-started       → path = "getting-started"
// /docs/api/core/loader       → path = "api/core/loader"
```

### Optional catch-all: [[...param]]

The gotcha with `[...path]`: it does **not** match the parent path. `/docs/[...path]/page.tsx` matches `/docs/anything` but not `/docs` itself — visiting `/docs` gives you a 404.

If you want both the parent and the children to render the same component, use a double-bracket optional catch-all:

```
app/docs/[[...path]]/page.tsx  → /docs AND /docs/*
```

At the root, `ctx.params.path` is `undefined`. Check for it:

```ts
export async function loader(ctx: LoaderContext) {
  const slug = ctx.params.path ?? 'index'
  const doc = await loadMarkdown(`content/docs/${slug}.md`)
  return { doc }
}
```

Now `/docs` loads `content/docs/index.md` and `/docs/api/core` loads `content/docs/api/core.md`. One route file covers the whole tree.

## Nested layouts

Layouts are the reason you don't repeat your header and footer in every page. A `layout.tsx` wraps every page in its directory and below:

```
app/
  layout.tsx            ← wraps everything
  page.tsx              ← /
  dashboard/
    layout.tsx          ← wraps dashboard pages
    page.tsx            ← /dashboard
    settings/
      page.tsx          ← /dashboard/settings
```

The render tree for `/dashboard/settings`:

```
<RootLayout>
  <DashboardLayout>
    <SettingsPage />
  </DashboardLayout>
</RootLayout>
```

Layouts receive their children as a prop:

```tsx
// app/dashboard/layout.tsx
import type { PropsWithChildren } from 'react'
import { Link } from '@paretojs/core'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="dashboard-shell">
      <aside>
        <Link to="/dashboard">Overview</Link>
        <Link to="/dashboard/settings">Settings</Link>
        <Link to="/dashboard/billing">Billing</Link>
      </aside>
      <main>{children}</main>
    </div>
  )
}
```

Navigate between `/dashboard`, `/dashboard/settings`, `/dashboard/billing` — the sidebar never unmounts. Only the page content inside `<main>` changes. This is the nested-layout win: stable UI shells across related routes, without Redux-for-the-sidebar workarounds.

## Route groups: share a layout without a URL segment

You'll often want to share a layout between routes that *don't* share a URL prefix. Marketing pages (`/`, `/about`, `/pricing`) want one layout. Auth pages (`/login`, `/signup`) want a different layout. Neither wants the layout name in the URL.

Wrap directories in parentheses to make them route groups — they affect layout nesting but disappear from the URL:

```
app/
  (marketing)/
    layout.tsx          ← shared marketing layout
    page.tsx            → /
    pricing/
      page.tsx          → /pricing
  (auth)/
    layout.tsx          ← centered card, no nav
    login/
      page.tsx          → /login
```

No URL contains the word `marketing` or `auth`. The parentheses vanish at build time — they're purely a grouping mechanism for the file tree.

## A realistic example: multi-tenant SaaS

Let's put everything together. You're building a SaaS where each tenant has their own dashboard at `/t/:tenantSlug`, with a docs site, public marketing pages, and auth pages. Here's the full tree:

```
app/
  layout.tsx                        ← root layout (theme, fonts)

  (marketing)/
    layout.tsx                      ← marketing shell
    page.tsx                        → /
    pricing/
      page.tsx                      → /pricing

  (auth)/
    layout.tsx                      ← centered auth card
    login/
      page.tsx                      → /login

  t/
    [tenantSlug]/
      layout.tsx                    ← tenant shell (sidebar)
      loader.ts                     ← load tenant, 404 if missing
      page.tsx                      → /t/:tenantSlug
      projects/
        [projectId]/
          layout.tsx                ← project shell
          page.tsx                  → /t/:tenantSlug/projects/:projectId

  docs/
    [[...path]]/
      page.tsx                      → /docs AND /docs/*

  api/
    health/
      route.ts                      → /api/health (JSON)
```

Every pattern from this post is in there: route groups, dynamic params, optional catch-all, nested layouts at three levels, and a `route.ts` for JSON endpoints.

The root `layout.tsx` handles theme, fonts, and global providers. The tenant layout runs a loader that fetches the tenant record and throws a 404 if the slug is invalid — every page inside automatically gets the check. No page inside `/t/:tenantSlug/*` has to re-fetch the tenant or re-render the sidebar.

## Loader precedence: page.tsx vs loader.ts

You can export a `loader` from `page.tsx`:

```tsx
// app/blog/[slug]/page.tsx
export function loader(ctx: LoaderContext) {
  return { post: getPost(ctx.params.slug) }
}

export default function BlogPost() { /* ... */ }
```

Or put it in a separate file:

```ts
// app/blog/[slug]/loader.ts
export function loader(ctx: LoaderContext) {
  return { post: getPost(ctx.params.slug) }
}
```

**If both exist, `loader.ts` wins.** Use the separate file when your loader has heavy server-only dependencies (database drivers, file system calls, secret env vars) — keeping them out of `page.tsx` prevents accidental imports in client code paths.

## Route matching: specificity beats source order

When a URL could match multiple routes, Pareto picks the most specific one:

1. Static segments beat dynamic segments
2. Dynamic segments beat catch-all segments
3. Required catch-all beats optional catch-all

So for `/blog/featured`:

- `app/blog/featured/page.tsx` — static, wins
- `app/blog/[slug]/page.tsx` — dynamic, loses to static
- `app/blog/[...rest]/page.tsx` — catch-all, loses to dynamic

This means you can freely mix specific routes alongside dynamic ones. Define `/blog/featured` as a special static page, and every other slug falls through to `/blog/[slug]`. No conditional rendering inside the dynamic component, no matching priority to configure.

## What's not in the router

Pareto's router is deliberately smaller than Next.js's. Things it doesn't have:

- **No parallel routes.** One slot per layout.
- **No intercepting routes.** Modals that want a URL are just modals with URL state.
- **No middleware file convention.** Do auth checks in layout loaders.
- **No `private` folder convention.** If there's no `page.tsx`, it's not a route.

The upside: there's almost nothing to memorize. The whole routing system fits in one doc page and this blog post.

## Try it

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

Start with a single `page.tsx`. Add a `[slug]` when you need one. Reach for route groups when your layouts diverge. The router will keep up with whatever shape your app grows into.

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
