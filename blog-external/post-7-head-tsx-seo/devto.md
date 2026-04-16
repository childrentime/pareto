---
title: "head.tsx Is Just a React Component: Dynamic SEO Meta from Loader Data"
published: false
description: "Most SSR frameworks treat meta tags as a config object. Pareto treats them as a React component — which turns out to be a much better fit for dynamic per-page SEO, Open Graph, and Twitter cards."
tags: react, javascript, seo, webdev
series:
canonical_url: https://paretojs.tech/blog/head-tsx-seo/
cover_image:
---

Look at how most frameworks handle `<head>`:

```tsx
// Next.js
export const metadata = {
  title: 'Blog Post',
  description: '...',
  openGraph: { title: '...', images: [...] },
}

// Remix
export const meta: MetaFunction = ({ data }) => [
  { title: 'Blog Post' },
  { name: 'description', content: '...' },
  { property: 'og:image', content: data.post.coverImage },
]
```

Metadata is a config object. You shape strings and key-value pairs into whatever schema the framework prescribed, and the framework turns them into HTML tags.

[Pareto](https://github.com/childrentime/pareto) does something different. In Pareto, `head.tsx` is a React component that returns JSX:

```tsx
// app/head.tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="My awesome app." />
    </>
  )
}
```

That's it. No config schema to learn. No special `MetaDescriptor` type. You write `<title>` and `<meta>` tags, and React 19 hoists them into the document `<head>`.

This post is about why that's a better design, and what it unlocks — especially for dynamic SEO where the meta tags depend on data you fetched on the server.

## Why a component is better than a config

Three reasons, in order of importance.

### 1. You get JSX — including expressions, loops, and conditionals

A config object is static data. If you want "include this meta tag only when the user has a premium account," you end up building the object imperatively before returning it, or stuffing conditional logic into values.

A component is code. You express conditions the normal way:

```tsx
export default function Head({ loaderData }: HeadProps) {
  const data = loaderData as LoaderData
  return (
    <>
      <title>{data.product.name}</title>
      <meta name="description" content={data.product.tagline} />

      {data.product.coverImage && (
        <meta property="og:image" content={data.product.coverImage} />
      )}

      {data.product.keywords.map((kw) => (
        <meta property="article:tag" content={kw} key={kw} />
      ))}

      {data.product.isPaid && (
        <meta property="og:restricted" content="paywall" />
      )}
    </>
  )
}
```

Loops, guards, conditional rendering — everything React already does. No `metadataProvider`, no `generateMetadata` signature to remember. It's just JSX.

### 2. Head components compose like the rest of your app

Want to pull shared OG tags into a helper? It's a React component:

```tsx
function OpenGraphTags({ title, description, image }: OGProps) {
  return (
    <>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="article" />
    </>
  )
}

export default function Head({ loaderData }: HeadProps) {
  const { post } = loaderData as { post: Post }
  return (
    <>
      <title>{post.title} — My Blog</title>
      <meta name="description" content={post.excerpt} />
      <OpenGraphTags
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
      />
    </>
  )
}
```

In a config-object world, this is a helper function that returns an array that you spread into another array. Here, it's a component. Read the tree and you see the HTML that will end up in `<head>`.

### 3. React 19 does the hoisting for you

This is the feature that makes the whole thing work. In React 19, any `<title>`, `<meta>`, or `<link>` tag you render anywhere in the tree gets hoisted into the document `<head>` — both during SSR and during client-side navigation. There's no framework-specific `MetaProvider` collecting and serializing metadata. It's a React platform feature.

Pareto doesn't implement the hoisting. React does. Pareto just decides *where* to render your `head.tsx` component in the tree (between root and page) so the hoisting has something to pick up.

## The route tree determines what wins

Head components render from root to page. Each level contributes tags. When two levels render the same tag (say, two `<title>`s), the browser uses the last one — so the deepest route wins automatically.

```
app/
  head.tsx                  ← site defaults
  blog/
    head.tsx                ← overrides for /blog section
    [slug]/
      head.tsx              ← overrides for individual posts
```

The root sets defaults. The section level overrides them. The leaf route overrides again. This matches how you actually think about SEO — most tags are site-wide, a section diverges a little, and individual pages add their own specifics.

```tsx
// app/head.tsx — site defaults
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="The best app for doing things." />
      <link rel="icon" href="/favicon.ico" />
      <meta property="og:site_name" content="My App" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  )
}
```

```tsx
// app/blog/[slug]/head.tsx — overrides for individual posts
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData }: HeadProps) {
  const { post } = loaderData as { post: BlogPost }
  return (
    <>
      <title>{post.title} — My App</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={post.coverImage} />
      <meta property="article:published_time" content={post.publishedAt} />
      <meta property="article:author" content={post.author.name} />
      <link rel="canonical" href={`https://myapp.com/blog/${post.slug}`} />
    </>
  )
}
```

The final `<head>` for `/blog/hello-world` merges both: favicon and twitter defaults from root, title and every OG-specific tag from the post's head.tsx.

Same pattern, just a component tree. No `metadataMerge` function, no deep-merge semantics to learn.

## HeadProps: loader data, typed

Every head component receives two props:

```tsx
interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

`loaderData` is whatever that route's loader returned. It's typed `unknown` because head.tsx has no way to know your loader's schema at runtime — cast it to your actual type:

```tsx
export default function Head({ loaderData, params }: HeadProps) {
  const { post } = loaderData as { post: BlogPost }
  return <title>{post.title}</title>
}
```

This is the piece that makes dynamic SEO fall into place. The loader fetched the post. The head component gets the exact same data. Writing `<meta property="og:title" content={post.title} />` uses the same object.

No separate `generateMetadata` call that re-fetches the post. The data flows: loader → page + head, both render with the same result.

## A complete dynamic SEO example

Here's what shipping real per-page SEO for a product catalog looks like.

```ts
// app/products/[id]/loader.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const product = await db.product.findUnique({
    where: { id: ctx.params.id },
    include: { images: true, category: true },
  })

  if (!product) {
    throw new Response('Not found', { status: 404 })
  }

  return { product }
}
```

```tsx
// app/products/[id]/head.tsx
import type { HeadProps } from '@paretojs/core'

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: { url: string }[]
  inStock: boolean
}

export default function Head({ loaderData }: HeadProps) {
  const { product } = loaderData as { product: Product }
  const canonicalUrl = `https://shop.example.com/products/${product.id}`
  const primaryImage = product.images[0]?.url ?? '/default-og.png'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  }

  return (
    <>
      <title>{`${product.name} — Our Shop`}</title>
      <meta name="description" content={product.description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="product" />
      <meta property="og:title" content={product.name} />
      <meta property="og:description" content={product.description} />
      <meta property="og:image" content={primaryImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content={product.currency} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={product.name} />
      <meta name="twitter:description" content={product.description} />
      <meta name="twitter:image" content={primaryImage} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
```

One file. Dynamic title, full Open Graph, Twitter cards, canonical URL, and JSON-LD structured data — all derived from the same `product` object the page component uses. No duplicate fetches. No separate metadata API.

## Inline scripts that must run before paint

Occasionally you need a script to execute before the page paints — the classic example is setting a dark-mode class on `<html>` based on `localStorage`, so the user doesn't see a flash of the wrong theme.

Inline scripts work inside head.tsx:

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

One caveat: React 19 hoists `<title>`, `<meta>`, and `<link>` during client-side navigation, but **not** `<script>` tags. This is fine for initialization scripts that only need to run once on page load.

## The shorter story

Pareto's head system is a convention on top of a React 19 feature:

- `head.tsx` is a React component that returns JSX
- React 19 hoists `<title>`, `<meta>`, `<link>` into `<head>` automatically
- Head components receive `loaderData` and `params` as props
- The tree renders root-to-page; the last tag of a given kind wins

There's no separate metadata API to learn. If you know React, you know how to write meta tags. For anything dynamic — blog posts, product pages, user profiles, search results — the pattern is always the same: loader returns the data, head.tsx renders JSX that uses it, React 19 hoists the tags. SEO shipped.

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
