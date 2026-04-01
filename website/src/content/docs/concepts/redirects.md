---
title: Redirect & 404
description: Use redirect() and notFound() in loaders to control navigation.
---

## Redirect

Throw `redirect()` in a loader to send an HTTP redirect:

```tsx
import { redirect } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    throw redirect('/login')        // 302 by default
  }
  // or with custom status:
  throw redirect('/new-url', 301)   // permanent redirect
}
```

The framework catches the redirect and sends the appropriate HTTP response. Works on both SSR and client-side navigation. During SSR, the server sends an HTTP 302 (or 301) response. During client-side navigation, the router intercepts the redirect and navigates to the target URL without a full page reload.

## Common redirect patterns

### Auth guard

Redirect unauthenticated users to a login page, preserving the original URL so you can redirect back after login:

```tsx
export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    const returnTo = encodeURIComponent(ctx.req.url)
    throw redirect(`/login?returnTo=${returnTo}`)
  }
  return { user: await getUser(ctx.req.cookies.token) }
}
```

### URL migration

When you rename a route, add a redirect from the old URL to the new one using a 301 (permanent) status:

```tsx
// app/old-blog/page.tsx
export function loader() {
  throw redirect('/blog', 301)
}

export default function OldBlog() {
  return null // never renders
}
```

Search engines will update their indexes to the new URL when they receive a 301 redirect.

### Post-action redirect

After a form submission or mutation, redirect to a success page:

```tsx
export async function action(ctx: LoaderContext) {
  await createPost(ctx.req.body)
  throw redirect('/posts?created=true')
}
```

## 404 Not Found

Throw `notFound()` in a loader to render the `not-found.tsx` page:

```tsx
import { notFound } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  const post = await getPost(ctx.params.slug)
  if (!post) throw notFound()
  return { post }
}
```

Unlike throwing a generic `Error`, `notFound()` sets the HTTP status code to 404 and renders the `not-found.tsx` component. Use `notFound()` for expected "resource does not exist" conditions and `throw new Error()` for unexpected failures. See [Error Handling](/concepts/error-handling/) for how to catch unexpected errors with `ParetoErrorBoundary`.

## Redirect status codes

| Status | Meaning | When to use |
|--------|---------|-------------|
| `301` | Moved Permanently | URL has permanently changed — search engines update their index |
| `302` | Found (default) | Temporary redirect — the original URL remains canonical |
| `307` | Temporary Redirect | Same as 302 but preserves the HTTP method (POST stays POST) |
| `308` | Permanent Redirect | Same as 301 but preserves the HTTP method |

For most cases, the default 302 is correct. Use 301 only when the old URL will never serve content again.

## not-found.tsx

Place a `not-found.tsx` at the app root:

```tsx
// app/not-found.tsx
import { Link } from '@paretojs/core'

export default function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <p>This page could not be found.</p>
      <Link href="/">Go Home</Link>
    </div>
  )
}
```

This renders for both unmatched URLs and programmatic `notFound()` calls, with a 404 HTTP status code. The `not-found.tsx` component is wrapped by your root `layout.tsx`, so site-wide navigation remains accessible on the 404 page.

## Related

- [Error Handling](/concepts/error-handling/) — How `ParetoErrorBoundary` works and when to use it vs. `not-found.tsx`.
- [File-Based Routing](/concepts/routing/) — Where `not-found.tsx` fits in the route convention.
- [Resource Routes](/concepts/resource-routes/) — JSON API endpoints via `route.ts`.
