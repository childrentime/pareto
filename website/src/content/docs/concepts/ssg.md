---
title: Static Site Generation (SSG)
description: Pre-render pages at build time with zero configuration.
---

Pareto supports static site generation. Mark any page as static and it will be pre-rendered to HTML at build time. Static pages load instantly because they are served as plain HTML files — no server-side rendering on each request.

## How do I make a page static?

Export a `config` object with `render: 'static'`:

```tsx
// app/page.tsx
import type { RouteConfig } from '@paretojs/core'

export const config: RouteConfig = { render: 'static' }

export function loader() {
  return { version: '3.0.0' }
}

export default function HomePage() {
  const data = useLoaderData()
  return <h1>v{data.version}</h1>
}
```

The page is rendered once at build time and served as static HTML. The loader runs during the build, not on each request.

## How do I generate dynamic static pages?

For dynamic routes, export `staticParams()` to generate all paths:

```tsx
// app/blog/[slug]/page.tsx
export const config: RouteConfig = { render: 'static' }

export async function staticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

Each object returned by `staticParams()` generates one static HTML file. The `loader` function runs once per param combination at build time.

## When should I use SSG?

- **Marketing pages** — content rarely changes, benefits from fast TTFB
- **Documentation** — pre-rendered at build time, served via CDN
- **Blog posts** — static content that doesn't need per-request rendering
- **Changelog / release notes** — content that updates only on deploy

For pages with user-specific data or frequently changing content, use SSR (the default). You can mix SSR and SSG freely within the same app — some pages can be static while others render on every request.

## Deployment

Static pages are output as `.html` files in your build directory. You can serve them from any static hosting provider or CDN:

- **CDN (CloudFront, Cloudflare, Fastly)** — Upload the static files to a CDN for edge-cached delivery with minimal latency.
- **Static hosting (Netlify, Vercel, GitHub Pages)** — Deploy the static output directly. SSR pages still require a Node.js server, so a hybrid setup uses static hosting for SSG pages and a server for SSR pages.
- **Self-hosted (Nginx, Caddy)** — Serve static files from disk and proxy SSR requests to the Node.js server.

A common pattern is to put a CDN in front of your Express server. The CDN serves static pages from cache, and SSR requests pass through to your server.

## Does Pareto support ISR or revalidation?

Pareto does not currently support incremental static regeneration (ISR) — pages are generated once at build time and do not update until the next build. If you need content to update without a full rebuild, use SSR instead of SSG. You can add `Cache-Control` headers on the server to cache SSR responses at the CDN layer, which gives you a similar effect to ISR.

To add cache headers, apply Express middleware in your production server:

```ts
import express from 'express'

const app = express()
app.use('/blog', (req, res, next) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  next()
})
```

## Can I use streaming with SSG?

[Streaming SSR](/concepts/streaming/) (`defer()`) is not compatible with SSG. Static pages are fully rendered at build time, so there is no live HTTP connection to stream deferred data through. If a static page's loader returns `defer()`, all promises are awaited and resolved during the build — the page will not stream.

## Related

- [Configuration](/api/config/) — `configureVite` for customizing the build.
- [File-Based Routing](/concepts/routing/) — How `page.tsx` and route conventions work with SSG.
- [@paretojs/core API](/api/core/) — `RouteConfig` type reference.
