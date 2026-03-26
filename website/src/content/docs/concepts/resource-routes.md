---
title: Resource Routes
description: API endpoints via route.ts — no component, just loader/action.
---

A directory with `route.ts` but no `page.tsx` becomes a resource route — it returns JSON directly, no HTML rendering. Resource routes let you build API endpoints alongside your pages using the same [file-based routing](/concepts/routing/) conventions.

## Usage

```ts
// app/api/time/route.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return {
    timestamp: new Date().toISOString(),
    message: 'This is a resource route — no HTML, just JSON.',
  }
}
```

`GET /api/time` returns:

```json
{
  "timestamp": "2026-03-26T12:00:00.000Z",
  "message": "This is a resource route — no HTML, just JSON."
}
```

## HTTP methods

- **GET** → calls the `loader` export
- **POST / PUT / PATCH / DELETE** → calls the `action` export

```ts
// app/api/users/route.ts
export function loader(ctx: LoaderContext) {
  return { users: getAllUsers() }
}

export async function action(ctx: LoaderContext) {
  const body = ctx.req.body
  const user = await createUser(body)
  return { user }
}
```

## Response headers and status codes

The `ctx.res` object is a standard Express response. Set custom headers and status codes before returning data:

```ts
export function loader(ctx: LoaderContext) {
  ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  ctx.res.setHeader('X-Custom-Header', 'my-value')
  return { data: getCachedData() }
}

export async function action(ctx: LoaderContext) {
  const item = await createItem(ctx.req.body)
  ctx.res.status(201)
  return { item }
}
```

## Error handling in resource routes

Throw errors in resource routes the same way you would in page loaders. Pareto catches the error and returns a JSON error response:

```ts
export async function loader(ctx: LoaderContext) {
  const user = await getUser(ctx.params.id)
  if (!user) {
    ctx.res.status(404)
    return { error: 'User not found' }
  }
  return { user }
}
```

For structured error responses, you can set the status code explicitly. Unlike page routes, resource routes do not render error boundaries — they return JSON to the caller.

You can also use [`redirect()`](/concepts/redirects/) and `notFound()` in resource routes:

```ts
import { redirect, notFound } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    throw redirect('/login')
  }
  const resource = await getResource(ctx.params.id)
  if (!resource) throw notFound()
  return { resource }
}
```

## Authentication example

A common pattern is to check authentication in resource routes before returning data:

```ts
// app/api/profile/route.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const token = ctx.req.cookies.token
  if (!token) {
    ctx.res.status(401)
    return { error: 'Unauthorized' }
  }

  const user = await verifyToken(token)
  if (!user) {
    ctx.res.status(403)
    return { error: 'Invalid token' }
  }

  return { user }
}

export async function action(ctx: LoaderContext) {
  const token = ctx.req.cookies.token
  if (!token) {
    ctx.res.status(401)
    return { error: 'Unauthorized' }
  }

  const user = await verifyToken(token)
  if (!user) {
    ctx.res.status(403)
    return { error: 'Invalid token' }
  }

  const updated = await updateProfile(user.id, ctx.req.body)
  return { user: updated }
}
```

## Middleware patterns

For shared logic across multiple resource routes (auth checks, logging, rate limiting), use Express middleware via [`configureServer`](/api/config/) in your `pareto.config.ts`:

```ts
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  configureServer(app) {
    // Auth middleware for all /api/* routes
    app.use('/api', (req, res, next) => {
      const token = req.cookies.token
      if (!token) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      next()
    })

    // Logging middleware
    app.use('/api', (req, res, next) => {
      console.log(`${req.method} ${req.url}`)
      next()
    })
  },
}

export default config
```

This keeps auth logic in one place instead of repeating it in every resource route.

## Related

- [Configuration](/api/config/) — `configureServer` for adding Express middleware.
- [File-Based Routing](/concepts/routing/) — How `route.ts` fits into the file-based routing system.
- [Redirect & 404](/concepts/redirects/) — Using `redirect()` and `notFound()` in resource routes.
