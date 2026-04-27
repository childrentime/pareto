---
title: "你的页面只跟最慢的接口一样快：为什么大家都该上流式 SSR"
description: 一个慢接口能把所有用户的页面加载时间一起拖下水。木桶能装多少水，取决于最短的那块板。本文讲清楚短板效应的数学、用户体验代价，以及为什么流式 SSR 是不牺牲 SEO 的唯一解。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 4 月 27 日</p>

你打开 Chrome DevTools 看一下产品详情页。Network 面板里只有一行关键的请求——HTML 文档本身——它的"Waiting for response"已经卡了 1,400ms。从浏览器视角看，服务器是个黑盒，到现在一个字节都还没吐出来。

打开服务端的 APM 链路，黑盒才被撬开。这 1.4 秒里，你的 loader 同时打了五个上游接口：

- 鉴权 —— 30ms
- 购物车数量 —— 50ms
- 顶部导航数据 —— 80ms
- 商品详情 —— 200ms
- **个性化推荐 —— 1,400ms**

TTFB 1,400ms。首次绘制 1,420ms。每个用户、每次访问，浏览器都得等最慢的那个接口返回，才能拿到第一个字节的 HTML——尽管页面五分之四的数据在 200ms 内就已经准备好了。

这就是**短板效应**，几乎每个传统 SSR 应用都在为它买单。木桶能装多少水，取决于最短的那块板。页面渲染速度等于最慢依赖的速度。流式 SSR 是框架级别的解法。在 2026 年，它已经不是可选项。本文讲为什么。

## 数学：这个问题只会越来越严重

短板效应会随着数据依赖数量复合增长。假设你的 loader 里每个接口有 1% 的概率比中位数慢 5 倍（缓存冷、GC 暂停、网络抖动、依赖的依赖超时……）。一个接口时，p99 还能看。五个接口时，**至少有一个**慢的概率是：

```
1 - (1 - 0.01)^5 = 4.9%
```

十个接口就是 9.6%。页面 p99 不是接口 p99 的平均，而是**最大值**。在 loader 里加一个快接口不会让页面更快，但加一个慢接口一定会让页面更慢。

这就是现代 Web 应用的架构现实：

- 页面同时依赖用户数据、内容数据、导航数据、A/B 实验分桶、特性开关、推荐、广告、隐私同意、会话状态
- 每一个都是一个独立服务，常常是一个独立团队，甚至是一个独立公司
- 慢依赖很少被砍掉，只会一直加
- 个性化数据没法缓存
- 实时数据没法缓存
- CDN 救不了你——响应是按用户区分的

只要你的页面有任何一个你不能完全控制的外部依赖，你就有"最慢接口"问题。区别只是你打算怎么应对。

## 传统 SSR 的做法

标准的 SSR loader 模式是 `Promise.all`：

```ts
export async function loader() {
  const [user, nav, product, recs] = await Promise.all([
    getUser(),         // 30ms
    getNav(),          // 80ms
    getProduct(),      // 200ms
    getRecs(),         // 1400ms ← 等这个
  ])
  return { user, nav, product, recs }
}
```

渲染函数只被调用一次，所有数据都已经解析。HTML 一次性生成。响应体只有在最慢的请求返回之后才开始流出。

从用户视角：

- TTFB：1,400ms（在等 `recs`）
- 首次绘制：~1,420ms（TTFB + 解析）
- LCP：~1,450ms

用户对着空白标签页看了 1.4 秒。浏览器连 HTML 都还没开始解析，因为服务器一个字节都没发。CDN 救不了你——文档本身就慢。加带宽也救不了你——瓶颈是后端在等 I/O。

## 为什么"放到客户端去 fetch"不是答案

很多团队的第一反应是：服务端渲染外壳，水合后再去拉慢数据。这把一个问题变成了两个。

**瀑布流**：HTML → CSS → JS → 水合 → fetch → 渲染。每一步都阻塞下一步。在慢网下，慢区块的 TTI 比服务端拉数据还要更慢——客户端还得先下载和解析 JS。

**SEO**：搜索爬虫读 HTML 里的内容。水合后才渲染的推荐不在初始文档里。当慢数据**就是**重要数据时——商品评价、对比表、地区性内容——客户端 fetch 等于让页面在排名信号里隐身。

客户端 fetch 在某些场景是合理的（深度交互组件、视口触发的加载），但它不是"最慢接口"问题的解。它只是把延迟藏到一个 loading 转圈下面，用户照样得等。

## 为什么单靠缓存也不是答案

第二反应是"缓存就好"。缓存确实有用，也该做，但它解决不了架构层面的问题：

- **冷缓存会发生。** 每次发布都会冷一次。每次缓存淘汰都会冷一次。每次 key miss 都会冷一次。flush 之后第一个用户照样付全额延迟
- **个性化数据没法缓存。** 或者只能按用户缓存，长尾流量下命中率近 0
- **实时数据没法缓存。** 库存、价格、比分、聊天在线状态——缓存它们就是 bug
- **过期数据本身是 bug。** 激进缓存会发错信息；保守缓存又损失大部分收益

流式 SSR 是和缓存**组合**用的。能缓存的就缓存，不能缓存的就流式。两个策略不是替代关系，是分工。

## 流式 SSR 究竟做了什么

流式 SSR 打破了"全有或全无"的渲染。服务器在一个响应里发两种数据：

1. **外壳 + 快数据** —— 立刻刷给客户端，慢请求还在飞着的时候就开始
2. **慢数据** —— Suspense 边界 resolve 后，作为响应体的后续 chunk 流入

第一个 chunk 一到，浏览器就开始解析 HTML。CSS 和字体跟文档其余部分并行下载。等慢接口终于返回时，用户已经在页面上读了一秒了。

```ts
// app/product/loader.ts
import { defer } from '@paretojs/core'

export async function loader(ctx) {
  const [user, nav, product] = await Promise.all([
    getUser(ctx),     // 30ms
    getNav(ctx),      // 80ms
    getProduct(ctx),  // 200ms
  ])

  return defer({
    user, nav, product,           // 已解析——包含在外壳里
    recs: getRecs(ctx),           // promise——好了再流
  })
}
```

```tsx
// app/product/page.tsx
import { Await } from '@paretojs/core'
import { Suspense } from 'react'

export default function ProductPage({ data }) {
  return (
    <>
      <Header user={data.user} nav={data.nav} />
      <ProductDetail product={data.product} />

      <Suspense fallback={<RecsSkeleton />}>
        <Await resolve={data.recs}>
          {(recs) => <Recommendations items={recs} />}
        </Await>
      </Suspense>
    </>
  )
}
```

从用户视角（假设到最近 edge 的 RTT 约 40ms）：

- TTFB：~240ms —— RTT 加上 loader 里还在 `await` 的最慢那个 fetch（product，200ms）。它一 resolve，外壳就刷出去了，`recs` 还在飞
- 首次绘制：文档解析完后大约 ~290ms
- 顶栏、导航、商品详情：~290ms 可见
- 推荐：1,440ms 左右流入——但用户已经在页面上读了一秒多了

总工作量没变。后端延迟没变。用户体验完全两个东西。慢接口不再绑架其他模块。

## 一个具体的数字对比

同一个商品页，同一组接口，两种渲染策略：

| 指标 | 传统 SSR | 流式 SSR |
|---|---|---|
| TTFB | ~1,440ms（RTT + 最慢 fetch） | ~240ms（RTT + 还在 await 的最慢 fetch） |
| 首次绘制 | ~1,460ms | ~290ms |
| 首屏内容可见 | ~1,460ms | ~290ms |
| 推荐可见 | ~1,460ms | ~1,440ms |
| 首字节字节数 | 整个页面 | 只有外壳 |
| SEO | 完整页面 | 完整页面（慢数据仍在 HTML 里，只是流的后段） |
| 后端成本 | 一致 | 一致 |

流式 SSR 并不解决布局抖动——这事得你自己做。`<Suspense>` 的 fallback 如果渲染高度跟真实内容对不上，跳起来跟客户端骨架屏一样厉害。把高度预算好（固定 `min-height`、aspect-ratio 占位、行数匹配的骨架），CLS 才能稳。

最后一行最关键。流式 SSR 没让慢接口变快，它只是不再让慢接口阻塞其他模块。这是结构性的修复，不是性能魔法。

## 为什么这是新的默认

2024 年，流式 SSR 是高阶玩家的玩具。2026 年，它是基础设施。每个像样的 React 框架都支持它：Next.js（通过 RSC + Suspense）、Remix 和 React Router（`defer()` 和 `<Await>`）、TanStack Start、[Pareto](https://github.com/childrentime/pareto)。原因不是流行——而是替代方案就是给每个后端有不止一个依赖的人发一个明显更差的页面。后者就是所有人。

剩下要决定的不再是"我要不要用流式 SSR"，而是"我用哪种抽象去做"。React Server Components 是一种答案——它带来流式，但也带来了 `"use client"`、双组件模型，以及"哪段代码在哪边跑"的大量心智负担。另一种答案是 loader + `defer()` 模型：普通的 React 组件，普通的 Suspense 边界，loader 里多一个原语而已。Pareto 选了后一条路。结果是客户端 JS 大约只有 Next.js 等价实现的 1/4，没有 RSC 的心智税——但流式行为是一样的，因为这是响应在线上实际发生的事。

## 实际怎么做

如果你已经有一个 SSR 应用，迁移是机械且渐进的：

1. **找出你的慢接口。** 看 loader 里每个 fetch 的 p95。超过 200ms 的都是候选
2. **把慢的放进 `defer()`。** loader 里不要 `await`，直接传 promise
3. **消费方包一层 `<Suspense>` + `<Await>`。** fallback 提供合适的占位高度
4. **量 TTFB 和 FCP。** 它们应该掉到大约 RTT 加上你 loader 里还在 `await` 的最慢那个 fetch——不是整页最慢的那个

你不是在重写页面。你只是切断了"快渲染被慢数据拖住"那根线。

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

延伸阅读：
- [不用 Server Components 也能做 React 流式 SSR](/zh/blog/streaming-ssr/) —— 完整代码的实战指南
- [SSR 性能基准测试](/zh/blog/benchmarks/) —— Pareto vs Next.js、React Router、TanStack Start 的压力测试
- [head.tsx 就是一个 React 组件](/zh/blog/head-tsx-seo/) —— 用 loader 数据生成动态 SEO meta

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
