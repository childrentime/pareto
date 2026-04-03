# We Benchmarked Our SSR Framework Against Next.js — Here's What We Found

We built [Pareto](https://github.com/childrentime/pareto), a lightweight streaming-first React SSR framework on Vite. Claims are cheap — so we built an automated benchmark suite that runs in CI on every PR, comparing Pareto against **Next.js**, **React Router (Remix)**, and **TanStack Start** on identical hardware.

## What We Tested

Four scenarios covering the most common SSR workloads:

- **Static SSR** — Page with inline data, no async loader. Pure SSR throughput.
- **Data Loading** — Loader with simulated 10ms DB query. SSR + data fetching overhead.
- **Streaming SSR** — defer() + Suspense with 200ms delayed data. Streaming pipeline efficiency.
- **API / JSON** — Pure JSON endpoint. Routing + serialization overhead.

All benchmarks on GitHub Actions (Ubuntu, Node 22, 4 CPUs), using autocannon with 100 connections for 30 seconds.

## Throughput: Requests Per Second

Static SSR: Pareto 2,224/s | **Next.js 3,328/s** | React Router 997/s | TanStack Start 2,009/s

Data Loading: **Pareto 2,733/s** | Next.js 293/s | React Router 955/s | TanStack Start 1,386/s

Streaming SSR: **Pareto 247/s** | Next.js 236/s | React Router 247/s | TanStack Start 247/s

API / JSON: **Pareto 3,675/s** | Next.js 2,212/s | React Router 1,950/s

Next.js wins on static SSR. But the moment a loader is involved, Pareto handles **9.3x more requests than Next.js** and **2.9x more than React Router**.

## Load Capacity: Max Sustainable QPS

We ran a ramp-up test from 1 to 1,000 concurrent connections, measuring the max QPS each framework sustains while keeping p99 latency under 500ms.

- Data Loading: **Pareto 2,735/s** vs Next.js 331/s vs React Router 1,044/s
- Streaming SSR: **Pareto 2,022/s** vs Next.js 310/s vs React Router 807/s
- API / JSON: **Pareto 3,556/s** vs Next.js 1,419/s vs React Router 1,912/s

Under streaming SSR load, Pareto sustains **2,022 req/s** — that's **6.5x Next.js** and **2.5x React Router**.

**What this looks like in practice:** Say your product page needs to serve 2,000 req/s at peak. With Pareto, that's a single server. With Next.js at 331/s, you'd need **6 servers** behind a load balancer. For streaming SSR dashboards, it's **1 Pareto instance** vs **7 Next.js instances**.

That's not just a benchmark number — it's a direct reduction in infrastructure cost, deployment complexity, and operational overhead.

## Latency

Under 100 concurrent connections, Pareto's data loading p99 is **702ms** while Next.js spikes to **7.82s**. In real terms: 99% of your users get their data-driven page in under 700ms with Pareto. With Next.js under the same load, 1 in 100 users waits nearly 8 seconds — long enough to close the tab.

## Bundle Size

Pareto ships **62 KB** of client JavaScript (gzipped) — roughly 1/4 of what Next.js sends (233 KB). On a typical 4G mobile connection (~5 Mbps), that's **100ms** to download vs **370ms**. On slower 3G (~1.5 Mbps), it's **330ms vs 1.2 seconds** just for the JavaScript.

## The Cost Difference

A SaaS dashboard serving 10,000 data-loading req/s at peak:

- **Pareto**: 4 servers (~$160/mo)
- TanStack Start: 7 servers (~$280/mo)
- React Router: 10 servers (~$400/mo)
- Next.js: 31 servers (~$1,240/mo)

*(Based on sustainable QPS per framework, $40/mo per 4-CPU instance.)*

For a team growing from 1,000 to 10,000 DAUs, the difference between 4 servers and 31 servers isn't just cost — it's operational simplicity.

## How We Keep Benchmarks Honest

- **CI automated** — runs on every PR touching core code
- **System tuning** — ASLR disabled, CPU governor performance mode
- **Median aggregation** — eliminates outlier noise
- **Sequential isolation** — one framework at a time
- **Same hardware** — all frameworks on the same runner

The full suite is [open source](https://github.com/childrentime/pareto/tree/main/benchmarks). Run it yourself.

```
npx create-pareto my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
