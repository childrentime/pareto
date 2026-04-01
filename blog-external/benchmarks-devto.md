---
title: "We Benchmarked Our SSR Framework Against Next.js — Here's What We Found"
published: true
tags: react, nextjs, performance, ssr
series:
canonical_url: https://paretojs.tech/blog/benchmarks/
cover_image:
---

We built [Pareto](https://github.com/childrentime/pareto), a lightweight streaming-first React SSR framework on Vite. Claims are cheap — so we built an automated benchmark suite that runs in CI on every PR, comparing Pareto against **Next.js**, **React Router (Remix)**, and **TanStack Start** on identical hardware.

## What We Tested

Four scenarios covering the most common SSR workloads:

- **Static SSR** — Page with inline data, no async loader. Pure SSR throughput.
- **Data Loading** — Loader with simulated 10ms DB query. SSR + data fetching overhead.
- **Streaming SSR** — `defer()` + Suspense with 200ms delayed data. Streaming pipeline efficiency.
- **API / JSON** — Pure JSON endpoint. Routing + serialization overhead.

All benchmarks on GitHub Actions (Ubuntu, Node 22, 4 CPUs), using [autocannon](https://github.com/mcollina/autocannon) with 100 connections for 30 seconds.

## Throughput: Requests Per Second

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | 2,224/s | **3,328/s** | 997/s | 2,009/s |
| Data Loading | **2,733/s** | 293/s | 955/s | 1,386/s |
| Streaming SSR | **247/s** | 236/s | 247/s | 247/s |
| API / JSON | **3,675/s** | 2,212/s | 1,950/s | — |

Next.js wins on static SSR. But the moment a loader is involved, Pareto handles **9.3x more requests than Next.js** and **2.9x more than React Router**.

## Load Capacity: Max Sustainable QPS

We ran a ramp-up test from 1 to 1,000 concurrent connections, measuring the max QPS each framework sustains while keeping p99 latency under 500ms.

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | **2,281/s** | 2,203/s | 1,098/s | 1,515/s |
| Data Loading | **2,735/s** | 331/s | 1,044/s | 1,458/s |
| Streaming SSR | **2,022/s** | 310/s | 807/s | 960/s |
| API / JSON | **3,556/s** | 1,419/s | 1,912/s | — |

Under streaming SSR load, Pareto sustains **2,022 req/s** — that's **6.5x Next.js** and **2.5x React Router**.

**What this looks like in practice:** Say your product page needs to serve 2,000 req/s at peak. With Pareto, that's a single server. With Next.js at 331/s, you'd need **6 servers** behind a load balancer. For streaming SSR dashboards, it's **1 Pareto instance** vs **7 Next.js instances**.

## Latency

| Scenario | Pareto p50/p99 | Next.js p50/p99 | React Router p50/p99 |
|---|---:|---:|---:|
| Static SSR | 431ms / 1.35s | **244ms / 326ms** | 704ms / 7.16s |
| Data Loading | **350ms / 702ms** | 1.42s / 7.82s | 760ms / 7.41s |
| API / JSON | **266ms / 320ms** | 283ms / 321ms | 486ms / 2.12s |

Under 100 concurrent connections, Pareto's data loading p99 is **702ms** while Next.js spikes to **7.82s**. 99% of users get their page in under 700ms with Pareto. With Next.js, 1 in 100 users waits nearly 8 seconds.

## Bundle Size

| Framework | Client JS (gzip) | Total (gzip) |
|---|---:|---:|
| **Pareto** | **62 KB** | **72 KB** |
| Next.js | 233 KB | 409 KB |
| React Router | 100 KB | 102 KB |
| TanStack Start | 101 KB | 272 KB |

62 KB of client JavaScript — roughly 1/4 of Next.js. On 4G mobile (~5 Mbps), that's **100ms** to download vs **370ms**. On 3G, it's **330ms vs 1.2 seconds** before any rendering begins.

## The Cost Difference

Here's a concrete scenario — a SaaS dashboard at 10,000 data-loading req/s peak:

| Framework | Servers needed (4 CPU) | Monthly cost (est.) |
|---|---:|---:|
| **Pareto** | **4** | ~$160 |
| TanStack Start | 7 | ~$280 |
| React Router | 10 | ~$400 |
| Next.js | 31 | ~$1,240 |

## How We Keep Benchmarks Honest

- **CI automated** — runs on every PR touching core code
- **System tuning** — ASLR disabled, CPU governor `performance`
- **Median aggregation** — eliminates outlier noise, CV% for stability
- **Sequential isolation** — one framework at a time, cooldown between runs
- **Same hardware** — all frameworks on the same GitHub Actions runner

The full suite is open source: [github.com/childrentime/pareto/tree/main/benchmarks](https://github.com/childrentime/pareto/tree/main/benchmarks)

```bash
npx create-pareto my-app
cd my-app && npm install && npm run dev
```

---

*Pareto is a lightweight, streaming-first React SSR framework built on Vite. [GitHub](https://github.com/childrentime/pareto) · [Docs](https://paretojs.tech)*
