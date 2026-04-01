---
title: "Pareto SSR 性能基准测试"
description: 我们将 Pareto 与 Next.js、React Router、TanStack Start 进行了全方位的吞吐量、延迟、负载和产物体积对比。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 3 月 31 日</p>

Pareto 的设计目标是轻量和快速。但光说不够——我们需要数据。所以我们构建了一套自动化基准测试，在完全相同的硬件上将 Pareto 与 **Next.js**、**React Router (Remix)** 和 **TanStack Start** 进行对比，并且在每个涉及核心代码的 PR 上自动运行。

## 测试场景

四个覆盖最常见 SSR 工作负载的场景：

- **Static SSR** — 内联数据页面，无异步 loader。测量纯 SSR 吞吐量。
- **Data Loading** — 带 10ms 模拟数据库查询的 loader。测量 SSR + 数据获取开销。
- **Streaming SSR** — `defer()` + Suspense，200ms 延迟数据。测量流式管道效率。
- **API / JSON** — 纯 JSON 端点。测量路由 + 序列化开销。

所有测试在 GitHub Actions 上运行（Ubuntu, Node 22, 4 CPUs），使用 [autocannon](https://github.com/mcollina/autocannon)，100 并发连接，10 pipelining，每个场景 30 秒。

## 吞吐量：每秒请求数

| 场景 | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | 2,224/s | **3,328/s** | 997/s | 2,009/s |
| Data Loading | **2,733/s** | 293/s | 955/s | 1,386/s |
| Streaming SSR | **247/s** | 236/s | 247/s | 247/s |
| API / JSON | **3,675/s** | 2,212/s | 1,950/s | — |

Next.js 在静态 SSR 上表现最好——对于不需要获取数据的页面，它的渲染管道做了深度优化。但一旦涉及 loader，Pareto 立即领先。在数据加载场景下，Pareto 处理的请求量是 **Next.js 的 9.3 倍**、**React Router 的 2.9 倍**。

API 端点上，Pareto 的极简路由层优势明显：**3,675 req/s**，Next.js 为 2,212/s。更少的框架开销意味着同样的硬件能服务更多请求。

## 单机负载能力：最大可持续 QPS

固定并发下的吞吐量只是一部分。我们还做了阶梯式压测，从 1 到 1,000 并发连接逐步增加，测量每个框架在 p99 延迟 < 500ms、错误率 < 1% 条件下的最大可持续 QPS。

| 场景 | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | **2,281/s** | 2,203/s | 1,098/s | 1,515/s |
| Data Loading | **2,735/s** | 331/s | 1,044/s | 1,458/s |
| Streaming SSR | **2,022/s** | 310/s | 807/s | 960/s |
| API / JSON | **3,556/s** | 1,419/s | 1,912/s | — |

差距在这里变得非常明显。流式 SSR 下，Pareto 可持续 **2,022 req/s**——是 **Next.js 的 6.5 倍**、**React Router 的 2.5 倍**。Next.js 在 310/s 时就触及 p99 阈值并开始丢弃请求。

数据加载场景下，Pareto 在 1,000 并发连接时仍能保持 **2,735/s**，而 Next.js 的上限是 331/s。

**这意味着什么：** 假设你的产品页面有一个查询数据库的 loader，高峰期需要每秒处理 2,000 个请求。用 Pareto，一台服务器就够了。Next.js 每个实例只能处理 331/s，你需要负载均衡后面挂 **6 台服务器**才能承载相同的流量。对于流式 SSR——比如带延迟加载分析组件的仪表板——同样的 2,000 req/s 需要 **1 台 Pareto** vs **7 台 Next.js**。

这不只是一个基准测试数字——而是基础设施成本、部署复杂度和运维负担的直接缩减。

## 延迟

| 场景 | Pareto p50/p99 | Next.js p50/p99 | React Router p50/p99 |
|---|---:|---:|---:|
| Static SSR | 431ms / 1.35s | **244ms / 326ms** | 704ms / 7.16s |
| Data Loading | **350ms / 702ms** | 1.42s / 7.82s | 760ms / 7.41s |
| API / JSON | **266ms / 320ms** | 283ms / 321ms | 486ms / 2.12s |

在 100 并发连接下，Pareto 的数据加载 p99 是 **702ms**，Next.js 飙升到 **7.82s**。实际意义：Pareto 下 99% 的用户在 700ms 内拿到数据页面；而 Next.js 在相同负载下，每 100 个用户中有 1 个要等将近 8 秒——足以关掉页面。如果你的网站遇到流量高峰（产品上线、营销活动），Pareto 优雅降级，Next.js 的尾部延迟直接爆炸。

## 产物体积

| 框架 | 客户端 JS (gzip) | 服务端 Bundle (gzip) | 总计 (gzip) |
|---|---:|---:|---:|
| **Pareto** | **62 KB** | 10 KB | **72 KB** |
| Next.js | 233 KB | 176 KB | 409 KB |
| React Router | 100 KB | 3 KB | 102 KB |
| TanStack Start | 101 KB | 172 KB | 272 KB |

Pareto 发送到客户端的 JavaScript 仅 **62 KB**（gzip 后）——大约是 Next.js（233 KB）的四分之一。在典型 4G 移动网络（~5 Mbps）下，下载和解析的时间差是 **100ms vs 370ms**。在更慢的 3G 网络（~1.5 Mbps）下，光 JavaScript 就需要 **330ms vs 1.2 秒**——渲染还没开始。对于每 100ms 加载时间都影响跳出率的内容型网站，这个差距至关重要。

## 如何保证基准测试的可信度

- **CI 自动化** — 每个修改 `packages/core/src/` 的 PR 自动触发，不存在挑选本地测试结果。
- **系统调优** — 关闭 ASLR，CPU governor 设为 `performance`，提升 fd 上限，减少 OS 调度带来的波动。
- **中位数聚合** — 使用中位数而非平均值来消除异常值干扰，并用 CV%（变异系数）标记不稳定的结果。
- **顺序隔离** — 一次只运行一个框架，运行间有冷却期，不存在资源争抢。
- **相同硬件** — 所有框架在同一个 GitHub Actions runner 的同一个 job 中测试。

完整的测试套件开源在 [`benchmarks/`](https://github.com/childrentime/pareto/tree/main/benchmarks) 目录下，你可以自己跑：

```bash
cd benchmarks
pnpm install
pnpm bench:all
```

## 这意味着什么

来看一个具体场景。你在运营一个 SaaS 仪表板，高峰期每秒 10,000 个数据加载请求。你的选项：

| 框架 | 需要的服务器数（4 CPU） | 月基础设施费用（估算） |
|---|---:|---:|
| **Pareto** | **4 台** | ~$160 |
| TanStack Start | 7 台 | ~$280 |
| React Router | 10 台 | ~$400 |
| Next.js | 31 台 | ~$1,240 |

*（基于可持续 QPS：2,735/s、1,458/s、1,044/s 和 331/s，按每台 4-CPU 实例 $40/月估算。实际费用因地区和云厂商而异。）*

对于一个日活从 1,000 增长到 10,000 的团队来说，需要 4 台还是 31 台服务器的差距不仅是成本——而是运维复杂度。更少的服务器意味着更少的故障点、更简单的部署、更多的时间花在产品而不是基础设施上。

这些不是合成的微基准——它们是带路由、渲染和数据获取的完整框架应用。性能差异来自 Pareto 的极简架构：没有中间件链，没有插件系统，你的代码和 Node HTTP 服务器之间没有多余的抽象层。

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
