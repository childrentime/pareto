---
title: "@paretojs/core/node"
description: Server-only exports — request handler, security headers, and production server.
---

Server-side APIs for custom Express setups and production deployments.

```ts
import {
  createRequestHandler,
  securityHeaders,
  startProductionServer,
  SECURITY_HEADERS,
} from '@paretojs/core/node'
```

## `createRequestHandler(options)`

Creates an Express middleware that handles all Pareto routing — page rendering, loader execution, streaming, and client-side navigation data requests. This is the core of the server runtime.

Called internally by the build-generated server bundle with the correct options (routes, manifest, module loader, etc.). You do not need to call this directly — use the custom server pattern via `app.ts` instead (see below).

## `securityHeaders()`

Express middleware that sets OWASP-recommended baseline security headers on every response:

```ts
import { securityHeaders } from '@paretojs/core/node'

app.use(securityHeaders())
```

Headers set by this middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer info sent to other origins |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused browser features |
| `X-DNS-Prefetch-Control` | `off` | Prevents speculative DNS resolution |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS (only effective over HTTPS) |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolates browsing context for Spectre mitigation |

Applied automatically in development and when using the built-in production server. For custom servers, add it manually.

## `SECURITY_HEADERS`

The raw header list as `[string, string][]` tuples, if you need to apply them outside of Express middleware:

```ts
import { SECURITY_HEADERS } from '@paretojs/core/node'

// e.g. in a serverless function
for (const [name, value] of SECURITY_HEADERS) {
  response.headers.set(name, value)
}
```

## `startProductionServer(outDir, appFilePath?)`

Starts the built-in production server. Used by `pareto start` internally. Loads the server bundle from `outDir`, serves static assets with proper caching, and applies security headers.

If `appFilePath` is provided, it loads the file and uses the default export as a custom Express app. This lets you add middleware, custom routes, or any Express configuration while still using Pareto's routing:

```ts
// app.ts (custom server)
import express from 'express'
import { securityHeaders } from '@paretojs/core/node'

const app = express()
app.use(securityHeaders())
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

export default app
```

The custom app is merged with Pareto's request handler — your custom routes take priority, and any unmatched requests fall through to Pareto's routing.

## Custom server example

For full control over the Express server, create an `app.ts` at your project root:

```ts
// app.ts
import express from 'express'
import { securityHeaders } from '@paretojs/core/node'

const app = express()

app.use(securityHeaders())

app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', crypto.randomUUID())
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

export default app
```

Run `pareto start` and it will automatically detect and use your `app.ts`.

## Related

- [Configuration](/api/config/) — `ParetoConfig` and CLI options.
- [Resource Routes](/concepts/resource-routes/) — API endpoints via `route.ts`.
