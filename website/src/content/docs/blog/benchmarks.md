---
title: "Pareto SSR Benchmarks: How We Compare"
description: We benchmarked Pareto against Next.js, React Router, and TanStack Start across throughput, latency, load capacity, and bundle size. Here's what we found.
template: splash
---

<p class="blog-meta">By <a href="https://github.com/childrentime">childrentime</a> · March 31, 2026</p>

Pareto is designed to be lightweight and fast. But claims are cheap — we wanted numbers. So we built an automated benchmark suite that compares Pareto against **Next.js**, **React Router (Remix)**, and **TanStack Start** on identical hardware, running in CI on every PR that touches the core.

This post summarizes the results and explains what they mean.

## What we tested

Four scenarios that cover the most common SSR workloads:

- **Static SSR** — A page with inline data, no async loader. Measures pure SSR throughput.
- **Data Loading** — A loader with a simulated 10ms DB query. Measures SSR + data fetching overhead.
- **Streaming SSR** — `defer()` + Suspense with 200ms delayed data. Measures streaming pipeline efficiency.
- **API / JSON** — A pure JSON endpoint. Measures routing + serialization overhead.

All benchmarks run on GitHub Actions (Ubuntu, Node 22, 4 CPUs), using [autocannon](https://github.com/mcollina/autocannon) with 100 connections and 10 pipelining for 30 seconds per scenario.

## Throughput: requests per second

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | 2,224/s | **3,328/s** | 997/s | 2,009/s |
| Data Loading | **2,733/s** | 293/s | 955/s | 1,386/s |
| Streaming SSR | **247/s** | 236/s | 247/s | 247/s |
| API / JSON | **3,675/s** | 2,212/s | 1,950/s | — |

Next.js wins on static SSR — its rendering pipeline is highly optimized for pages that don't fetch data. But the moment a loader is involved, Pareto takes the lead. In the data loading scenario, Pareto handles **9.3x more requests than Next.js** and **2.9x more than React Router**.

For API endpoints, Pareto's minimal routing layer shows: **3,675 req/s** vs Next.js at 2,212/s. Less framework overhead means more throughput for the same hardware.

## Load capacity: max sustainable QPS

Throughput at a fixed concurrency only tells part of the story. We also ran a ramp-up test that progressively increases connections from 1 to 1,000, measuring the maximum QPS each framework sustains while keeping p99 latency under 500ms and error rate under 1%.

| Scenario | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | **2,281/s** | 2,203/s | 1,098/s | 1,515/s |
| Data Loading | **2,735/s** | 331/s | 1,044/s | 1,458/s |
| Streaming SSR | **2,022/s** | 310/s | 807/s | 960/s |
| API / JSON | **3,556/s** | 1,419/s | 1,912/s | — |

This is where the differences become dramatic. Under streaming SSR load, Pareto sustains **2,022 req/s** — that's **6.5x Next.js** and **2.5x React Router**. Next.js hits its p99 threshold at just 310/s and starts shedding requests.

For data loading, Pareto sustains **2,735/s** at 1,000 connections while Next.js tops out at 331/s.

**What this looks like in practice:** Say your product page has a data loader hitting a database, and you need to serve 2,000 requests per second at peak. With Pareto, that's a single server. With Next.js at 331/s per instance, you'd need **6 servers** behind a load balancer to handle the same traffic. For streaming SSR — think a dashboard with deferred analytics widgets — serving 2,000 req/s would take **1 Pareto instance** vs **7 Next.js instances**.

That's not just a benchmark number — it's a direct reduction in infrastructure cost, deployment complexity, and operational overhead.

## Latency

| Scenario | Pareto p50/p99 | Next.js p50/p99 | React Router p50/p99 |
|---|---:|---:|---:|
| Static SSR | 431ms / 1.35s | **244ms / 326ms** | 704ms / 7.16s |
| Data Loading | **350ms / 702ms** | 1.42s / 7.82s | 760ms / 7.41s |
| API / JSON | **266ms / 320ms** | 283ms / 321ms | 486ms / 2.12s |

Under 100 concurrent connections, Pareto's data loading p99 is **702ms** while Next.js spikes to **7.82s**. In real terms: 99% of your users get their data-driven page in under 700ms with Pareto. With Next.js under the same load, 1 in 100 users waits nearly 8 seconds — long enough to close the tab. If your site gets a traffic spike (product launch, marketing campaign), Pareto degrades gracefully while Next.js tail latency explodes.

## Bundle size

| Framework | Client JS (gzip) | Server Bundle (gzip) | Total (gzip) |
|---|---:|---:|---:|
| **Pareto** | **62 KB** | 10 KB | **72 KB** |
| Next.js | 233 KB | 176 KB | 409 KB |
| React Router | 100 KB | 3 KB | 102 KB |
| TanStack Start | 101 KB | 172 KB | 272 KB |

Pareto ships **62 KB** of client JavaScript (gzipped) — roughly a quarter of what Next.js sends (233 KB). On a typical 4G mobile connection (~5 Mbps), that's the difference between **100ms** to download and parse vs **370ms**. On slower 3G networks (~1.5 Mbps), it's **330ms vs 1.2 seconds** just for the JavaScript — before any rendering begins. For content-heavy sites where every 100ms of load time impacts bounce rate, this gap matters.

## How we keep benchmarks honest

- **Automated in CI** — Benchmarks run on every PR that touches `packages/core/src/`. No cherry-picked local runs.
- **System tuning** — ASLR disabled, CPU governor set to `performance`, fd limits raised. Reduces variance from OS-level scheduling.
- **Median aggregation** — We use median instead of mean to eliminate outlier noise, with CV% (coefficient of variation) to flag unstable results.
- **Sequential isolation** — One framework at a time, with cooldown between runs. No resource contention.
- **Same hardware** — All frameworks tested on the same GitHub Actions runner in the same job.

The full benchmark suite is open source in the [`benchmarks/`](https://github.com/childrentime/pareto/tree/main/benchmarks) directory. Run it yourself:

```bash
cd benchmarks
pnpm install
pnpm bench:all
```

## What this means for you

Here's a concrete scenario. You're running a SaaS dashboard that serves 10,000 data-loading requests per second at peak. Your options:

| Framework | Servers needed (4 CPU each) | Monthly infra cost (estimate) |
|---|---:|---:|
| **Pareto** | **4 servers** | ~$160 |
| TanStack Start | 7 servers | ~$280 |
| React Router | 10 servers | ~$400 |
| Next.js | 31 servers | ~$1,240 |

*(Based on 2,735/s, 1,458/s, 1,044/s, and 331/s sustainable QPS respectively, with $40/mo per 4-CPU instance. Real costs vary.)*

For a team that's growing from 1,000 to 10,000 daily active users, the difference between needing 4 servers and 31 servers isn't just cost — it's operational simplicity. Fewer servers means fewer things that can break, simpler deployments, and less time spent on infrastructure instead of product.

These are not synthetic micro-benchmarks — they're full framework apps with routing, rendering, and data fetching. The performance difference comes from Pareto's minimal architecture: no middleware chain, no plugin system, no abstraction layers between your code and Node's HTTP server.

Try it:

```bash
npx create-pareto my-app
```

<style>
{`
  .blog-meta {
    font-size: 0.875rem;
    color: var(--sl-color-gray-3);
    margin-bottom: 2rem;
  }
  .blog-meta a {
    color: var(--sl-color-accent);
  }
`}
</style>
