---
title: Error Handling
description: Catch render errors with ParetoErrorBoundary in your layouts and pages.
---

Pareto provides `ParetoErrorBoundary`, a React error boundary component you can place anywhere in your component tree. It catches errors from child components and renders a fallback UI instead of crashing the entire page.

## ParetoErrorBoundary

Import `ParetoErrorBoundary` from `@paretojs/core` and wrap any section of your UI that might throw:

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
    </div>
  )
}

export default function Page() {
  return (
    <ParetoErrorBoundary fallback={ErrorFallback}>
      <RiskyComponent />
    </ParetoErrorBoundary>
  )
}
```

The `fallback` prop accepts a React component that receives an `error` prop with the thrown `Error` object.

## Using in layouts

A common pattern is wrapping the page content in your root layout so that errors in any page are caught without breaking the navigation:

```tsx
// app/layout.tsx
import { ParetoErrorBoundary } from '@paretojs/core'
import type { PropsWithChildren } from 'react'

function GlobalError({ error }: { error: Error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <a href="/">Go Home</a>
    </div>
  )
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header>My App</header>
      <main>
        <ParetoErrorBoundary fallback={GlobalError}>
          {children}
        </ParetoErrorBoundary>
      </main>
    </>
  )
}
```

Because the error boundary is inside the layout, the header stays visible even when a page throws — users can navigate away without a full page reload.

## Nested error boundaries

You can nest multiple `ParetoErrorBoundary` components. Errors bubble up to the nearest boundary:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      <ParetoErrorBoundary fallback={ChartError}>
        <RevenueChart />
      </ParetoErrorBoundary>

      <ParetoErrorBoundary fallback={TableError}>
        <UserTable />
      </ParetoErrorBoundary>
    </div>
  )
}
```

If `RevenueChart` throws, only that section shows the error fallback. `UserTable` remains interactive. This gives you fine-grained control over error isolation.

## Loader errors

When a loader throws, the server returns an error response. You can handle expected conditions with [`notFound()`](/concepts/redirects/) or [`redirect()`](/concepts/redirects/) instead of throwing generic errors:

```tsx
export function loader(ctx: LoaderContext) {
  const user = await getUser(ctx.params.id)
  if (!user) throw notFound()  // renders not-found.tsx with 404 status
  return { user }
}
```

For unexpected loader failures, the error propagates to the nearest `ParetoErrorBoundary` in the component tree.

## Recovery

Your error fallback component can include a retry button:

```tsx
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  )
}
```

## App-level error page

For errors not caught by any `ParetoErrorBoundary`, create `app/error.tsx` to show a custom error page instead of the built-in default:

```tsx
// app/error.tsx
export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
    </div>
  )
}
```

This is optional — if no `error.tsx` exists, Pareto shows a built-in fallback. Use `ParetoErrorBoundary` for granular, component-level error isolation, and `error.tsx` for a catch-all error page.

## Related

- [Redirect & 404](/concepts/redirects/) — Use `notFound()` for expected missing-resource conditions.
- [Streaming SSR](/concepts/streaming/) — Deferred promises that reject are caught by the nearest `ParetoErrorBoundary`.
- [@paretojs/core API](/api/core/) — Full API reference for `ParetoErrorBoundary`.
