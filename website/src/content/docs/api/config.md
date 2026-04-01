---
title: Configuration
description: pareto.config.ts — customize your Pareto app.
---

Create a `pareto.config.ts` in your project root to customize Pareto's behavior.

```tsx
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  // options
}

export default config
```

## ParetoConfig type

```tsx
interface ParetoConfig {
  appDir?: string
  outDir?: string
  configureVite?: (config: UserConfig, context: { isServer: boolean }) => UserConfig
  wkWebViewFlushHint?: boolean
}
```

## Options

### `appDir`

The directory containing your route files. Defaults to `app`.

### `outDir`

The output directory for production builds. Defaults to `.pareto`.

### `wkWebViewFlushHint`

Inject a hidden element with 200+ zero-width characters into the HTML shell to force iOS WKWebView to begin rendering before the stream completes. WebKit delays first paint until visible text exceeds 200 characters, which can cause a white flash for minimal-text pages loaded inside native iOS apps. Has no visual effect and is ignored by screen readers. Only relevant for WKWebView — Safari and Chrome browsers are not affected. Defaults to `false`.

### `configureVite`

Extend the Vite configuration. This function receives the current Vite config and an `env` object indicating whether the build is for the server or client. Return the modified config:

```tsx
import react from '@vitejs/plugin-react'

const config: ParetoConfig = {
  configureVite(config, { isServer }) {
    config.plugins.push(myPlugin())

    // Server-only config
    if (isServer) {
      config.ssr = {
        ...config.ssr,
        external: ['heavy-library'],
      }
    }

    return config
  },
}
```

Use cases for `configureVite`:

- Adding Vite plugins (Tailwind, SVG imports, etc.)
- Customizing the build output directory
- Configuring SSR externals for Node.js-only packages
- Adding path aliases (`resolve.alias`)
- Modifying the dev server proxy settings

## Environment variables

Pareto uses Vite's built-in environment variable handling. Variables prefixed with `VITE_` are exposed to client-side code:

```bash
# .env
VITE_API_URL=https://api.example.com    # Available on client and server
DATABASE_URL=postgres://localhost/mydb   # Server only
```

Access them in your code:

```tsx
// Client and server
const apiUrl = import.meta.env.VITE_API_URL

// Server only (loaders, resource routes)
const dbUrl = process.env.DATABASE_URL
```

Vite supports `.env`, `.env.local`, `.env.development`, and `.env.production` files. See the [Vite env docs](https://vite.dev/guide/env-and-mode) for the full loading order.

## CLI Commands

```bash
pareto dev          # Start dev server with HMR
pareto build        # Build for production
pareto start        # Start production server
```

### Dev options

```bash
pareto dev --port 8080    # Custom port (default: 3000)
pareto dev --host 0.0.0.0 # Expose to network
```

### Build options

```bash
pareto build              # Build for production
```

### Production options

```bash
pareto start              # Start production server (default port: 3000)
pareto start --port 8080  # Custom port
```

## Port configuration

The default port is `3000`. You can change it in three ways, listed by priority (highest first):

1. **CLI flag**: `pareto dev --port 8080`
2. **Environment variable**: `PORT=8080 pareto dev`
3. **Default**: `3000`

## Production setup

For production deployments, build first, then start:

```bash
npm run build    # Runs pareto build
npm run start    # Runs pareto start
```

The build step outputs (inside the configured `outDir`, default `.pareto`):
- `.pareto/client/` — Static assets (JS, CSS, images) for CDN deployment
- `.pareto/server/` — Server bundle for the Node.js runtime

A minimal production `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY .pareto/ .pareto/
EXPOSE 3000
CMD ["npx", "pareto", "start"]
```

## Related

- [Resource Routes](/concepts/resource-routes/) — API endpoints via `route.ts`.
- [@paretojs/core API](/api/core/) — `ParetoConfig` type and runtime exports.
