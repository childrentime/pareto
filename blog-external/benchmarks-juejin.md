# 我们把自己的 SSR 框架和 Next.js 做了全方位性能对比

我们做了 [Pareto](https://github.com/childrentime/pareto)，一个基于 Vite 的轻量级流式 React SSR 框架。光说快不够——所以我们构建了一套自动化基准测试套件，在完全相同的硬件上将 Pareto 与 **Next.js**、**React Router (Remix)** 和 **TanStack Start** 进行了对比。测试在 CI 中自动运行，每个涉及核心代码的 PR 都会触发。

## 测试场景

四个覆盖最常见 SSR 工作负载的场景：

- **Static SSR** — 内联数据页面，无异步 loader。测量纯 SSR 吞吐量
- **Data Loading** — 带 10ms 模拟数据库查询的 loader。测量 SSR + 数据获取开销
- **Streaming SSR** — `defer()` + Suspense，200ms 延迟数据。测量流式管道效率
- **API / JSON** — 纯 JSON 端点。测量路由 + 序列化开销

所有测试在 GitHub Actions 上运行（Ubuntu, Node 22, 4 CPUs），使用 [autocannon](https://github.com/mcollina/autocannon)，100 并发连接，每场景 30 秒。

## 吞吐量：每秒请求数

| 场景 | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | 2,224/s | **3,328/s** | 997/s | 2,009/s |
| Data Loading | **2,733/s** | 293/s | 955/s | 1,386/s |
| Streaming SSR | **247/s** | 236/s | 247/s | 247/s |
| API / JSON | **3,675/s** | 2,212/s | 1,950/s | — |

Next.js 在静态 SSR 上表现最好。但一旦涉及 loader，Pareto 处理的请求量是 **Next.js 的 9.3 倍**、**React Router 的 2.9 倍**。

## 单机负载能力：最大可持续 QPS

我们做了阶梯式压测，从 1 到 1,000 并发连接逐步增加，测量每个框架在 p99 延迟 < 500ms、错误率 < 1% 条件下的最大可持续 QPS。

| 场景 | Pareto | Next.js | React Router | TanStack Start |
|---|---:|---:|---:|---:|
| Static SSR | **2,281/s** | 2,203/s | 1,098/s | 1,515/s |
| Data Loading | **2,735/s** | 331/s | 1,044/s | 1,458/s |
| Streaming SSR | **2,022/s** | 310/s | 807/s | 960/s |
| API / JSON | **3,556/s** | 1,419/s | 1,912/s | — |

流式 SSR 下，Pareto 可持续 **2,022 req/s**——是 **Next.js 的 6.5 倍**、**React Router 的 2.5 倍**。

**这意味着什么：** 假设你的产品页面高峰期需要每秒处理 2,000 个请求。用 Pareto，一台服务器就够了。Next.js 每个实例只能处理 331/s，你需要负载均衡后面挂 **6 台服务器**。对于流式 SSR 仪表板，同样的 2,000 req/s 需要 **1 台 Pareto** vs **7 台 Next.js**。

这不只是基准测试数字——而是基础设施成本、部署复杂度和运维负担的直接缩减。

## 延迟

| 场景 | Pareto p50/p99 | Next.js p50/p99 | React Router p50/p99 |
|---|---:|---:|---:|
| Static SSR | 431ms / 1.35s | **244ms / 326ms** | 704ms / 7.16s |
| Data Loading | **350ms / 702ms** | 1.42s / 7.82s | 760ms / 7.41s |
| API / JSON | **266ms / 320ms** | 283ms / 321ms | 486ms / 2.12s |

在 100 并发连接下，Pareto 的数据加载 p99 是 **702ms**，Next.js 飙升到 **7.82s**。99% 的用户在 Pareto 下 700ms 内拿到数据页面；Next.js 在相同负载下，每 100 个用户中有 1 个要等将近 8 秒——足以关掉页面。

## 产物体积

| 框架 | 客户端 JS (gzip) | 总计 (gzip) |
|---|---:|---:|
| **Pareto** | **62 KB** | **72 KB** |
| Next.js | 233 KB | 409 KB |
| React Router | 100 KB | 102 KB |
| TanStack Start | 101 KB | 272 KB |

62 KB gzip 后——约为 Next.js 的四分之一。在 4G 网络（~5 Mbps）下，下载时间 **100ms vs 370ms**。在 3G 网络下，**330ms vs 1.2 秒**——渲染还没开始。

## 服务器成本差异

一个 SaaS 仪表板，高峰期每秒 10,000 个数据加载请求：

| 框架 | 需要的服务器数（4 CPU） | 月费用（估算） |
|---|---:|---:|
| **Pareto** | **4 台** | ~$160 |
| TanStack Start | 7 台 | ~$280 |
| React Router | 10 台 | ~$400 |
| Next.js | 31 台 | ~$1,240 |

*（基于可持续 QPS，按每台 4-CPU 实例 $40/月估算。）*

需要 4 台还是 31 台服务器的差距不仅是成本——而是运维复杂度。更少的服务器意味着更少的故障点、更简单的部署。

## 如何保证基准测试的可信度

- **CI 自动化** — 每个修改核心代码的 PR 自动触发
- **系统调优** — 关闭 ASLR，CPU governor 设为 performance
- **中位数聚合** — 消除异常值干扰，CV% 标记不稳定结果
- **顺序隔离** — 一次只运行一个框架，运行间冷却
- **相同硬件** — 同一个 GitHub Actions runner

完整测试套件开源：[github.com/childrentime/pareto/tree/main/benchmarks](https://github.com/childrentime/pareto/tree/main/benchmarks)

```bash
npx create-pareto my-app
cd my-app && npm install && npm run dev
```

---

[Pareto](https://github.com/childrentime/pareto) — 轻量级流式 React SSR 框架 | [文档](https://paretojs.tech)
