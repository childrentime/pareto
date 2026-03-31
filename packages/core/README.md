<p align="center">
  <a href="https://paretojs.tech">
    <h1 align="center">Pareto</h1>
  </a>
</p>

<p align="center">
  <a href="https://paretojs.tech/guides/introduction">Documentation</a>
  ·
  <a href="https://github.com/childrentime/pareto/blob/main/CHANGELOG.md">Changelog</a>
  ·
  <a href="https://github.com/childrentime/pareto/issues">Issues</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@paretojs/core"><img src="https://img.shields.io/npm/v/@paretojs/core.svg" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@paretojs/core"><img src="https://img.shields.io/npm/dm/@paretojs/core.svg" alt="npm downloads"></a>
  <a href="https://github.com/childrentime/pareto/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@paretojs/core.svg" alt="license"></a>
</p>

## Getting Started

Visit [https://paretojs.tech/guides/introduction](https://paretojs.tech/guides/introduction) to get started with Pareto.

## What is Pareto?

Pareto is a lightweight, streaming-first React SSR framework built on Vite. It provides file-based routing, NDJSON streaming for client navigation, per-route head management, and Immer-powered state with automatic SSR hydration.

```bash
npx create-pareto my-app
```

## Features

- **Streaming SSR** — `renderToPipeableStream` with `defer()` for progressive data delivery through Suspense
- **Vite-powered** — Instant dev starts, React Fast Refresh, native ESM in development
- **File-based routing** — `page.tsx` · `layout.tsx` · `loader.ts` · `head.tsx` · `document.tsx` · `not-found.tsx`
- **Client navigation** — SPA-feel `<Link>` with prefetching, backed by NDJSON streaming
- **Head management** — Per-route `head.tsx` React components with nested merge and deduplication
- **State management** — Immer-powered `defineStore()` and `defineContextStore()` with automatic SSR hydration
- **TypeScript-first** — Full type safety across loaders, pages, and configuration
- **Security headers** — Built-in OWASP baseline middleware

## Documentation

Visit [paretojs.tech](https://paretojs.tech) to view the full documentation.

## Community

- [GitHub Issues](https://github.com/childrentime/pareto/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/childrentime/pareto/discussions) — Questions and ideas

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

## License

MIT
