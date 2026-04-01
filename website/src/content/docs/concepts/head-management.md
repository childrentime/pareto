---
title: Head Management
description: Per-route title, meta tags, and scripts via head.tsx — a React component with full JSX support.
---

Each route can export a default React component from `head.tsx` to set `<title>`, meta tags, scripts, and other head elements. Head components are defined at each level of the route tree and rendered from root to page, so you set site-wide defaults once and override per-route as needed.

## head.tsx

Head files export a default React component that returns JSX. React 19 automatically hoists `<title>`, `<meta>`, and `<link>` tags into the document `<head>`.

```tsx
// app/head.tsx (root — applies to all pages)
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="My awesome app." />
    </>
  )
}
```

```tsx
// app/blog/head.tsx (overrides title for /blog)
export default function Head() {
  return (
    <>
      <title>Blog — My App</title>
      <meta name="description" content="Read our latest posts." />
    </>
  )
}
```

## HeadProps

Head components receive loader data and route params as props:

```tsx
import type { HeadProps } from '@paretojs/core'

interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

## Rendering behavior

Head components render from root to page. When multiple components render the same tag, the browser uses the last one — so the deepest route's `<title>` wins automatically.

This means your root `head.tsx` can define defaults (site-wide meta, scripts), and individual routes override only what they need.

## Inline scripts

You can include inline scripts directly in head.tsx. This is useful for things like dark mode initialization that must run before paint:

```tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
                document.documentElement.classList.add('dark')
            } catch(e) {}
          })()`,
        }}
      />
    </>
  )
}
```

Note: inline scripts are rendered in the `<head>` during SSR but are **not** hoisted by React 19 during client-side navigation. This is fine for initialization scripts that only need to run once on page load.

## OG and Twitter card meta tags

Use the `property` attribute for Open Graph tags and the `name` attribute for Twitter cards:

```tsx
export default function Head() {
  return (
    <>
      <title>My Blog Post — My App</title>
      <meta name="description" content="A deep dive into streaming SSR." />
      {/* Open Graph */}
      <meta property="og:title" content="My Blog Post" />
      <meta property="og:description" content="A deep dive into streaming SSR." />
      <meta property="og:image" content="https://example.com/og-image.png" />
      <meta property="og:type" content="article" />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="My Blog Post" />
      <meta name="twitter:description" content="A deep dive into streaming SSR." />
      <meta name="twitter:image" content="https://example.com/og-image.png" />
    </>
  )
}
```

## Dynamic head based on loader data

The Head component receives the loader data for its route, so you can set titles and meta tags based on server-fetched content:

```tsx
// app/blog/[slug]/head.tsx
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData, params }: HeadProps) {
  const post = (loaderData as { post: { title: string; excerpt: string } }).post
  return (
    <>
      <title>{`${post.title} — My App`}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
    </>
  )
}
```

This pattern is essential for dynamic pages like blog posts, product pages, or user profiles where the meta tags depend on the data being displayed.

## Adding external resources with link

Use `<link>` tags for stylesheets, favicons, or preload hints:

```tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <link rel="icon" href="/favicon.ico" />
      <link rel="canonical" href="https://example.com/" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
    </>
  )
}
```

## Client-side navigation

During client-side navigation, Head components are lazy-loaded and rendered into the component tree. React 19 automatically hoists `<title>`, `<meta>`, and `<link>` tags into the document `<head>` — no manual DOM manipulation needed.

## Related

- [File-Based Routing](/concepts/routing/) — Where to place `head.tsx` files in the route tree.
- [@paretojs/core API](/api/core/) — `HeadProps` and `HeadComponent` type reference.
