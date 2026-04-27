---
title: "Your Page Is Only as Fast as Your Slowest API: The Case for Streaming SSR"
published: false
description: "One slow API drags every user's page load down with it. The bucket fills to the height of the shortest plank. Here's the math, the user-experience cost, and why streaming SSR is the only fix that doesn't trade SEO for speed."
tags: react, javascript, ssr, webdev
series:
canonical_url: https://paretojs.tech/blog/slowest-api/
cover_image:
---

You open Chrome DevTools on your product page. The Network tab has exactly one row that matters — the HTML document — and it's been stuck on "Waiting for response" for 1,400ms. From the browser's point of view, the server is a black box that hasn't said a word yet.

Pull up the server's APM trace and the black box opens up. Inside that 1.4 seconds, your loader fanned out to five upstream services:

- Auth check — 30ms
- Cart count — 50ms
- Header navigation data — 80ms
- Product details — 200ms
- **Personalized recommendations — 1,400ms**

Time to first byte: 1,400ms. Time to first paint: 1,420ms. Every user, every page view, waits for the slowest API before the browser sees a single byte of HTML — even though four-fifths of the page's data was ready in 200ms.

This is the short-board effect, and almost every traditional SSR app pays it. The bucket fills to the height of the shortest plank. The page renders at the speed of the slowest dependency. Streaming SSR is the framework-level fix, and in 2026 it's no longer optional. Here's why.

## The math: why this gets worse, not better

The short-board effect compounds with the number of data dependencies. Suppose each API in your loader has a 1% chance of running 5x slower than its median (cold cache, GC pause, network hiccup, dependency of a dependency timing out). With one API, your p99 page latency is fine. With five APIs, the probability that **at least one** is slow on a given request is:

```
1 - (1 - 0.01)^5 = 4.9%
```

With ten APIs it's 9.6%. The page p99 isn't the average of API p99 — it's the **max**. Adding a fast endpoint to your loader can't make the page faster, but adding a slow one always makes the page slower.

This is the architectural reality of every modern web app:

- Pages depend on user data, content data, navigation data, A/B test buckets, feature flags, recommendations, ads, analytics consent, session state.
- Each one is a separate service, often a separate team, often a separate company.
- Slow dependencies rarely get removed. They just get added to.
- Personalized data can't be cached.
- Real-time data can't be cached.
- The CDN can't help — the response is per-user.

If your page has any external dependency you don't fully control, you have a slowest-API problem. The question is what you do about it.

## What traditional SSR does

The standard SSR loader pattern is `Promise.all`:

```ts
export async function loader() {
  const [user, nav, product, recs] = await Promise.all([
    getUser(),         // 30ms
    getNav(),          // 80ms
    getProduct(),      // 200ms
    getRecs(),         // 1400ms ← waits for this
  ])
  return { user, nav, product, recs }
}
```

The render function gets called once, with all data resolved. The HTML is generated in one pass. The response body starts flowing only after the slowest fetch returns.

From the user's perspective:

- TTFB: 1,400ms (waiting for `recs`)
- First paint: ~1,420ms (TTFB + parse)
- Largest contentful paint: ~1,450ms

The user is staring at a blank tab for 1.4 seconds. The browser hasn't even started parsing HTML, because the server hasn't sent any. Adding a CDN doesn't help — the document itself is slow. Adding more bandwidth doesn't help — the bottleneck is server-side compute waiting on I/O.

## Why "just fetch on the client" isn't the answer

The first instinct for many teams is: render the shell server-side, fetch the slow data after hydration. This trades one problem for two.

**Waterfall**: HTML → CSS → JS → hydrate → fetch → render. Each step blocks the next. On a slow network, the time-to-interactive for the slow section is even higher than it was server-side, because the client now has to download and parse JS first.

**SEO**: Search crawlers read what's in the HTML. Recommendations rendered after hydration aren't in the initial document. For pages where the slow data is the **important** data — product reviews, comparison tables, location-specific content — client fetching makes the page invisible to ranking signals.

Client-side fetching is sometimes the right call (deeply interactive widgets, viewport-triggered loads), but it's not a fix for the slowest-API problem. It just hides the latency behind a loading spinner that the user has to wait through anyway.

## Why caching alone isn't the answer

"Cache it" is the second instinct. Caching helps, and you should do it. But it doesn't solve the architectural problem:

- **Cold caches happen.** Every deploy. Every cache eviction. Every key miss. The first user after a flush still pays full latency.
- **Personalized data can't be cached.** Or can be cached only per-user, with hit rates that hover near zero on long-tail traffic.
- **Real-time data can't be cached.** Inventory, prices, live scores, chat presence — caching them is the bug.
- **Stale data is its own bug.** Aggressive caching ships wrong information. Conservative caching loses most of the benefit.

Streaming SSR composes with caching. You cache what you can, you stream what you can't. The two strategies aren't alternatives — they target different problems.

## What streaming SSR actually does

Streaming SSR breaks the all-or-nothing render. The server sends two kinds of data in one response:

1. **The shell + fast data** — flushed to the client immediately, while slow fetches are still in flight.
2. **The slow data** — streamed in as Suspense fallbacks resolve, written to the same response body in chunks.

The browser starts parsing HTML as soon as the first chunk arrives. CSS and fonts kick off in parallel with the rest of the document. By the time the slow API returns, the user has already been reading the page for a second.

```ts
// app/product/loader.ts
import { defer } from '@paretojs/core'

export async function loader(ctx) {
  const [user, nav, product] = await Promise.all([
    getUser(ctx),     // 30ms
    getNav(ctx),      // 80ms
    getProduct(ctx),  // 200ms
  ])

  return defer({
    user, nav, product,           // resolved — included in shell
    recs: getRecs(ctx),           // promise — streams when ready
  })
}
```

```tsx
// app/product/page.tsx
import { Await } from '@paretojs/core'
import { Suspense } from 'react'

export default function ProductPage({ data }) {
  return (
    <>
      <Header user={data.user} nav={data.nav} />
      <ProductDetail product={data.product} />

      <Suspense fallback={<RecsSkeleton />}>
        <Await resolve={data.recs}>
          {(recs) => <Recommendations items={recs} />}
        </Await>
      </Suspense>
    </>
  )
}
```

From the user's perspective now (assuming ~40ms RTT to the nearest edge):

- TTFB: ~240ms — RTT plus the slowest fetch you still `await` in the loader (product, 200ms). The shell flushes the moment that resolves; `recs` is still in flight.
- First paint: ~290ms after the document parses
- Header, nav, product: visible at ~290ms
- Recommendations: stream in around 1,440ms — but the user has been reading the page for over a second already

Same total work. Same backend latency. Completely different user experience. The slow API no longer holds the rest of the page hostage.

## A concrete numbers table

Same product page, same APIs, two render strategies:

| Metric | Traditional SSR | Streaming SSR |
|---|---|---|
| TTFB | ~1,440ms (RTT + slowest fetch) | ~240ms (RTT + slowest *awaited* fetch) |
| First paint | ~1,460ms | ~290ms |
| Above-the-fold visible | ~1,460ms | ~290ms |
| Recommendations visible | ~1,460ms | ~1,440ms |
| Bytes to first byte | full page | shell only |
| SEO | full page | full page (slow data still in HTML, just later in the stream) |
| Backend cost | identical | identical |

Streaming SSR doesn't fix layout shift — that's on you. A `<Suspense>` fallback whose rendered height doesn't match the real content jumps just as hard as a client-side skeleton would. Budget the height (fixed `min-height`, aspect-ratio boxes, skeleton lines that match line counts) and CLS stays clean.

That last column is the important one. Streaming SSR doesn't make the slow API faster. It just stops it from blocking the rest of the page. The fix is structural, not performance-magic.

## Why this is the new default

In 2024, streaming SSR was a power-user feature. In 2026, it's table stakes. Every serious React framework supports it: Next.js (via RSC + Suspense), Remix and React Router (via `defer()` and `<Await>`), TanStack Start, [Pareto](https://github.com/childrentime/pareto). The reason isn't fashion — it's that the alternative is shipping a page that's measurably worse for everyone whose backend has more than one dependency. Which is everyone.

The remaining decision isn't "should I use streaming SSR." It's "which abstraction do I want to use to do it." React Server Components are one answer — they bring streaming, but they also bring `"use client"`, the dual-component model, and a lot of mental overhead about which code runs where. The other answer is the loader-plus-`defer()` model: ordinary React components, ordinary Suspense boundaries, one extra primitive in your loader. Pareto picks the second path. The result is roughly 1/4 the client JS of a Next.js equivalent and none of the RSC mental tax — but the streaming behavior is the same, because that's what the response actually does on the wire.

## What to actually do

If you have an existing SSR app, the migration is mechanical and incremental:

1. **Find your slow APIs.** Look at p95 of every fetch in your loaders. Anything past 200ms is a candidate.
2. **Move the slow ones into `defer()`.** Don't `await` them in the loader. Pass the promise.
3. **Wrap their consumer in `<Suspense>` + `<Await>`.** Provide a fallback that reserves the right amount of space.
4. **Measure TTFB and FCP.** They should drop to roughly your RTT plus the slowest fetch you still `await` in the loader — not the slowest fetch overall.

You're not rewriting the page. You're cutting the wire that ties the fast paint to the slow data.

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

Related reading on [paretojs.tech](https://paretojs.tech):

- [React Streaming SSR Without Server Components](https://paretojs.tech/blog/streaming-ssr/) — the practical how-to with full code
- [SSR Benchmarks: How We Compare](https://paretojs.tech/blog/benchmarks/) — Pareto vs Next.js, React Router, TanStack Start under load
- [head.tsx Is Just a React Component](https://paretojs.tech/blog/head-tsx-seo/) — dynamic SEO meta from loader data
