---
title: "@paretojs/core"
description: Core runtime exports — components, hooks, and helpers.
---

The main entry point for Pareto's runtime API.

```tsx
import {
  Link,
  Await,
  ParetoErrorBoundary,
  useLoaderData,
  useRouter,
  useStreamData,
  defer,
  redirect,
  notFound,
} from '@paretojs/core'
import type {
  HeadProps,
  HeadComponent,
  DocumentContext,
  HtmlAttributes,
  GetDocumentProps,
  LoaderContext,
  LoaderFunction,
  NavigateOptions,
  ParetoConfig,
} from '@paretojs/core'
```

## Components

### `<Link>`

Client-side navigation link. Intercepts clicks for same-origin navigation. See [File-Based Routing](/concepts/routing/) for how routes are defined.

```tsx
<Link href="/about">About</Link>
<Link href="/blog" prefetch="viewport">Blog</Link>
<Link href="/login" replace>Login</Link>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | required | Target URL |
| `prefetch` | `'hover' \| 'viewport' \| 'none'` | `'hover'` | Prefetch strategy |
| `replace` | `boolean` | `false` | Replace history entry |
| `scroll` | `boolean` | `true` | Scroll to top on navigation |

### `<Await>`

Renders deferred data from `defer()`. Shows `fallback` until the promise resolves. See [Streaming SSR](/concepts/streaming/) for usage patterns and error handling.

```tsx
<Await resolve={data.feed} fallback={<Skeleton />}>
  {(feed) => <Feed items={feed} />}
</Await>
```

### `<ParetoErrorBoundary>`

React error boundary for catching render errors. Wrap any section of your UI that might throw. See [Error Handling](/concepts/error-handling/) for usage patterns and nested boundary strategies.

```tsx
<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

| Prop | Type | Description |
|------|------|-------------|
| `fallback` | `React.ComponentType<{ error: Error }>` | Component to render when an error is caught |
| `children` | `ReactNode` | Content to render normally |

## Hooks

### `useLoaderData<T>()`

Access data returned by the route's `loader` function. The generic type parameter provides type safety for the returned data.

```tsx
const data = useLoaderData<{ user: User }>()
```

### `useRouter()`

Access the router state and navigation methods. Useful for programmatic navigation, active link styling, and navigation state.

```tsx
const { pathname, params, isNavigating, push, replace, back, prefetch } = useRouter()
```

| Property | Type | Description |
|----------|------|-------------|
| `pathname` | `string` | Current URL path |
| `params` | `Record<string, string>` | Dynamic route parameters |
| `isNavigating` | `boolean` | `true` during navigation transitions |
| `push(url, opts?)` | `(url: string, opts?: NavigateOptions) => void` | Navigate to URL (adds history entry) |
| `replace(url, opts?)` | `(url: string, opts?: NavigateOptions) => void` | Navigate to URL (replaces history entry) |
| `back()` | `() => void` | Navigate back in history |
| `prefetch(url)` | `(url: string) => void` | Prefetch a route's loader data |

`NavigateOptions` accepts `{ replace?: boolean, scroll?: boolean }`. For example, `push('/page', { scroll: false })` navigates without scrolling to top.

### `useStreamData<T>(promiseOrValue)`

Hook to consume a deferred value without `<Await>`. Suspends the component until the promise resolves, so it must be used inside a `<Suspense>` boundary.

```tsx
function Activity({ data }: { data: Promise<Items> | Items }) {
  const items = useStreamData(data)
  return <div>{items.length} items</div>
}
```

## Functions

### `defer(data)`

Wrap loader return value for streaming. Resolved values are sent immediately; promises stream in via Suspense. See [Streaming SSR](/concepts/streaming/) for detailed usage.

```tsx
return defer({
  instant: { count: 42 },
  streamed: fetchSlowData(),
})
```

### `redirect(url, status?)`

Throw in a loader to trigger an HTTP redirect. Default status: 302. See [Redirect & 404](/concepts/redirects/) for common patterns like auth guards and URL migrations.

```tsx
throw redirect('/login')
throw redirect('/new-url', 301)
```

### `notFound()`

Throw in a loader to render `not-found.tsx` with 404 status. See [Redirect & 404](/concepts/redirects/) for the difference between `notFound()` and throwing errors.

```tsx
throw notFound()
```

## Types

### `LoaderContext`

The context object passed to every `loader` and `action` function. Provides access to the Express request/response and route parameters.

```tsx
interface LoaderContext {
  req: Request   // Express request
  res: Response  // Express response
  params: Record<string, string>
}
```

### `LoaderFunction`

The type for `loader` functions exported from `page.tsx` or `loader.ts` files.

```tsx
type LoaderFunction = (context: LoaderContext) => unknown
```

### `HeadProps`

Props passed to Head components in `head.tsx` files. See [Head Management](/concepts/head-management/) for usage patterns.

```tsx
interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

### `HeadComponent`

The type for Head components exported from `head.tsx` files.

```tsx
type HeadComponent = (props: HeadProps) => ReactNode
```

### `DocumentContext`

The context object passed to `getDocumentProps` in `document.tsx`.

```tsx
interface DocumentContext {
  req: Request
  params: Record<string, string>
  pathname: string
  loaderData: unknown
}
```

### `HtmlAttributes`

The return type of `getDocumentProps`. All properties are applied as attributes on the `<html>` element. Common attributes `lang`, `dir`, and `className` are typed explicitly for convenience.

```tsx
type HtmlAttributes = Record<string, string> & {
  lang?: string
  dir?: string
  className?: string
}
```

### `GetDocumentProps`

The function type for `document.tsx` exports.

```tsx
type GetDocumentProps = (ctx: DocumentContext) => HtmlAttributes
```

See [Document Customization](/concepts/document-customization/) for `document.tsx` usage and [Error Handling](/concepts/error-handling/) for `error.tsx` usage.
