# React Streaming SSR Without Server Components — A Practical Guide

React Server Components get all the attention for streaming SSR. But RSC isn't the only way — and for many apps, it's more complexity than you need.

You can stream HTML from the server using renderToPipeableStream, defer(), and standard Suspense — no server components, no "use client" directives, no mental gymnastics about which component runs where. This post shows how, using [Pareto](https://github.com/childrentime/pareto) as the framework.

## What streaming SSR actually means

Traditional SSR works like this:

1. Request comes in
2. Server fetches **all** data
3. Server renders **complete** HTML
4. Browser receives the full page

The problem: if any data source is slow, the entire page is slow. A 200ms database query + a 2s external API call = every user waits 2+ seconds for first paint.

Streaming SSR works differently:

1. Request comes in
2. Server sends the HTML shell + fast data **immediately**
3. Slow data streams in as it resolves
4. Browser progressively renders each section

Users see content in milliseconds. Slow data appears as it becomes available. No full-page loading spinners.

## The building blocks

You need three things:

1. **A loader that separates fast and slow data** — defer() marks which values should stream
2. **Suspense boundaries in your component** — `<Await>` wraps each streaming section
3. **A streaming SSR runtime** — renderToPipeableStream under the hood

Pareto wires all three together. Here's a complete example.

## Building a streaming dashboard

Imagine a dashboard that shows:
- **User count** (fast — cached, ~5ms)
- **Activity feed** (medium — database query, ~100ms)
- **Analytics chart** (slow — external API, ~800ms)

### The loader

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  // Fast: resolve before passing to defer
  const userCount = await getCachedUserCount()

  return defer({
    userCount,  // already resolved — in initial HTML

    // Medium: streams in ~100ms after initial HTML
    activityFeed: db.query('SELECT * FROM activity ORDER BY created_at DESC LIMIT 20'),

    // Slow: streams in ~800ms after initial HTML
    analytics: fetch('https://analytics-api.example.com/dashboard')
      .then(res => res.json()),
  })
}
```

defer() takes an object. Synchronously resolved values (like userCount) are included in the initial HTML. Promises (like activityFeed and analytics) stream in as they resolve.

### The page component

```tsx
// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function Dashboard() {
  const { userCount, activityFeed, analytics } = useLoaderData()

  return (
    <div className="dashboard">
      {/* Renders immediately — data is already resolved */}
      <header>
        <h1>Dashboard</h1>
        <span className="stat">{userCount} active users</span>
      </header>

      {/* Streams in after ~100ms */}
      <section>
        <h2>Recent Activity</h2>
        <Await resolve={activityFeed} fallback={<ActivitySkeleton />}>
          {(feed) => (
            <ul>
              {feed.map(item => (
                <li key={item.id}>{item.user} {item.action}</li>
              ))}
            </ul>
          )}
        </Await>
      </section>

      {/* Streams in after ~800ms */}
      <section>
        <h2>Analytics</h2>
        <Await resolve={analytics} fallback={<ChartSkeleton />}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </section>
    </div>
  )
}
```

### What the user sees

- **0ms:** HTML shell + header with user count
- **~100ms:** Activity feed appears, replacing skeleton
- **~800ms:** Analytics chart appears, replacing skeleton

Compare this to traditional SSR: the user would see nothing until ~800ms (waiting for the slowest data source), then everything at once.

## Error handling in streams

What happens when a deferred promise rejects? The `<Await>` component throws, and the nearest error boundary catches it.

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => (
  <div className="error-card">
    <p>Failed to load analytics: {error.message}</p>
    <button onClick={() => window.location.reload()}>Retry</button>
  </div>
)}>
  <Await resolve={analytics} fallback={<ChartSkeleton />}>
    {(data) => <AnalyticsChart data={data} />}
  </Await>
</ParetoErrorBoundary>
```

Wrap each `<Await>` in its own error boundary. If the analytics API fails, the rest of the page stays intact.

## When NOT to stream

Streaming isn't always the right choice:

**Don't stream SEO-critical content.** Search crawlers may not execute JavaScript to reveal streamed sections. Return it synchronously from the loader.

**Don't stream small payloads.** If all data resolves in <50ms, the streaming overhead isn't worth it.

**Don't stream dependent data.** If your component can't render without all data, deferring individual pieces just creates multiple spinners:

```tsx
// Better: one loading state instead of three spinners
export function loader() {
  const [users, posts, comments] = await Promise.all([
    getUsers(), getPosts(), getComments()
  ])
  return { users, posts, comments }
}
```

## Client-side navigation: NDJSON streaming

On initial page load, streaming SSR delivers HTML progressively. But what about client-side navigations?

In Pareto 4.0, client navigations use **NDJSON (newline-delimited JSON) streaming**. When you click a Link, the client fetches loader data as a stream — non-deferred data arrives first, deferred data streams in as it resolves.

Suspense boundaries work identically on first load and on navigation. No behavioral difference, no special handling.

## Performance under load

Streaming SSR isn't just a UX improvement — it changes how your server handles concurrent requests.

Traditional SSR holds the response open until all data is ready. Under 100 concurrent connections, if each request waits for a 200ms API call, the server queues up fast.

Streaming SSR sends the initial HTML immediately and releases the rendering thread. This is why Pareto sustains **2,022 streaming req/s** vs Next.js at **310 req/s** under load — a 6.5x difference.

In practice: a streaming SSR dashboard serving 2,000 req/s needs 1 Pareto server vs 7 Next.js instances.

## The complete pattern

```tsx
// loader.ts — separate fast and slow data
import { defer } from '@paretojs/core'

export async function loader() {
  const fast = await getSyncData()   // resolve first
  return defer({
    fast,                            // resolved — in initial HTML
    slow: fetchExternalAPI(),        // Promise — streamed
  })
}

// page.tsx — standard React + Await
import { useLoaderData, Await } from '@paretojs/core'

export default function Page() {
  const { fast, slow } = useLoaderData()
  return (
    <div>
      <div>{fast.value}</div>
      <Await resolve={slow} fallback={<Skeleton />}>
        {(data) => <SlowSection data={data} />}
      </Await>
    </div>
  )
}

// head.tsx — meta tags with loader data
export default function Head({ loaderData }) {
  return <title>{loaderData.fast.title}</title>
}
```

No server components. No "use client". No framework magic. Just loaders, React, and Suspense.

```
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
