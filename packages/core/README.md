<p align="center">
  <a href="https://paretojs.tech">
    <h1 align="center">Pareto</h1>
  </a>
</p>

<p align="center">
  Lightweight, streaming-first React SSR framework built on Vite.
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

Pareto is a lightweight React SSR framework that prioritizes streaming. Built on Vite for instant dev starts, it provides file-based routing, NDJSON streaming for client navigation, per-route head management via React components, and Immer-powered state with automatic SSR hydration.

```bash
npx create-pareto my-app
cd my-app && npm install && npm run dev
```

## Performance

Pareto is built for throughput. In CI benchmarks against Next.js, React Router, and TanStack Start on identical hardware (Node 22, Ubuntu, 4 CPUs):

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| **Data Loading** | **2,733/s** | 293/s | 955/s | 1,386/s |
| **Streaming SSR** | **247/s** | 236/s | 247/s | 247/s |
| **API / JSON** | **3,675/s** | 2,212/s | 1,950/s | — |
| **Static SSR** | 2,224/s | **3,328/s** | 997/s | 2,009/s |

Under ramp-up load (1→1000 concurrent connections), Pareto sustains the highest QPS before hitting the p99 < 500ms threshold:

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| **Data Loading** | **2,735/s** | 331/s | 1,044/s | 1,458/s |
| **Streaming SSR** | **2,022/s** | 310/s | 807/s | 960/s |
| **API / JSON** | **3,556/s** | 1,419/s | 1,912/s | — |

Client JS sent to the browser: **62 KB** gzipped (vs Next.js 233 KB, React Router 100 KB, TanStack Start 101 KB).

In practice: a data-loading page serving 2,000 req/s at peak needs **1 Pareto server** vs **6 Next.js instances**. For streaming SSR, it's 1 vs 7.

> Benchmark details: [PR #12](https://github.com/childrentime/pareto/pull/12)

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

## Packages

- [`@paretojs/core`](./packages/core) — Core framework
- [`create-pareto`](./packages/create-pareto) — Project scaffolding CLI

## Community

- [GitHub Issues](https://github.com/childrentime/pareto/issues) — Bug reports and feature requests
- [GitHub Discussions](https://github.com/childrentime/pareto/discussions) — Questions and ideas

## Contributing

Contributions are welcome. Please open an issue first to discuss what you would like to change.

## License

MIT
