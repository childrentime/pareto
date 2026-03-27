---
title: Head Management
description: Per-route title and meta tags via head.tsx with automatic merging.
---

Each route can export a `head()` function from `head.tsx` to set `<title>` and meta tags. Head descriptors are defined at each level of the route tree and automatically merged from root to page, so you set site-wide defaults once and override per-route as needed.

## head.tsx

```tsx
// app/head.tsx (root — applies to all pages)
import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'My App',
    meta: [
      { name: 'description', content: 'My awesome app.' },
    ],
  }
}
```

```tsx
// app/blog/head.tsx (overrides title for /blog)
export function head(): HeadDescriptor {
  return {
    title: 'Blog — My App',
    meta: [
      { name: 'description', content: 'Read our latest posts.' },
    ],
  }
}
```

## HeadDescriptor

```tsx
interface HeadDescriptor {
  title?: string
  meta?: Record<string, string>[]
  link?: Record<string, string>[]
}
```

## Merging behavior

Head descriptors merge from root to page:
- **title**: last one wins (deepest route overrides)
- **meta**: deduplicated by `name` or `property` (deepest wins)
- **link**: deduplicated by `rel` + `href`

This means your root `head.tsx` can define defaults (charset, viewport, site-wide meta), and individual routes override only what they need. You do not have to repeat the full set of tags on every page.

## OG and Twitter card meta tags

Use the `property` key for Open Graph tags and the `name` key for Twitter cards:

```tsx
export function head(): HeadDescriptor {
  return {
    title: 'My Blog Post — My App',
    meta: [
      { name: 'description', content: 'A deep dive into streaming SSR.' },
      // Open Graph
      { property: 'og:title', content: 'My Blog Post' },
      { property: 'og:description', content: 'A deep dive into streaming SSR.' },
      { property: 'og:image', content: 'https://example.com/og-image.png' },
      { property: 'og:type', content: 'article' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'My Blog Post' },
      { name: 'twitter:description', content: 'A deep dive into streaming SSR.' },
      { name: 'twitter:image', content: 'https://example.com/og-image.png' },
    ],
  }
}
```

Because meta tags are deduplicated by `name` or `property`, a deeper route's OG tags automatically replace those set by a parent. This makes it straightforward to define site-wide fallback OG images in the root `head.tsx` and override them on specific pages.

## Dynamic head based on loader data

The `head()` function receives the loader data for its route, so you can set titles and meta tags based on server-fetched content:

```tsx
// app/blog/[slug]/head.tsx
import type { HeadDescriptor } from '@paretojs/core'

export function head({ loaderData, params }: { loaderData: { post: { title: string; excerpt: string } }; params: Record<string, string> }): HeadDescriptor {
  return {
    title: `${loaderData.post.title} — My App`,
    meta: [
      { name: 'description', content: loaderData.post.excerpt },
      { property: 'og:title', content: loaderData.post.title },
      { property: 'og:description', content: loaderData.post.excerpt },
    ],
  }
}
```

This pattern is essential for dynamic pages like blog posts, product pages, or user profiles where the meta tags depend on the data being displayed.

## Adding external resources with link

Use the `link` array to add stylesheets, favicons, or preload hints:

```tsx
export function head(): HeadDescriptor {
  return {
    title: 'My App',
    link: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'canonical', href: 'https://example.com/' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    ],
  }
}
```

## Client-side navigation

When navigating between pages, the title and meta tags update automatically — no full page reload needed. Pareto diffs the outgoing and incoming head descriptors and patches the DOM accordingly.

## Related

- [File-Based Routing](/concepts/routing/) — Where to place `head.tsx` files in the route tree.
- [@paretojs/core API](/api/core/) — `HeadDescriptor` type reference and `mergeHeadDescriptors` helper.
