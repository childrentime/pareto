---
title: "不用 Server Components 也能做 React 流式 SSR：实战指南"
description: 你不需要 React Server Components 也能做流式 SSR。本文用 loader、defer() 和 Suspense 构建一个流式 SSR 应用。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 4 月 3 日</p>

React Server Components 几乎垄断了流式 SSR 的话题。但 RSC 不是唯一的方案——对很多应用来说，它带来的复杂性远超收益。

你完全可以用 `renderToPipeableStream`、`defer()` 和标准 Suspense 来流式传输 HTML——不需要 Server Components，不需要 `"use client"` 指令，不需要纠结哪个组件在哪里运行。本文用 Pareto 框架演示具体怎么做。

## 流式 SSR 到底是什么

传统 SSR 的流程：

1. 请求进来
2. 服务器获取**所有**数据
3. 服务器渲染**完整** HTML
4. 浏览器收到完整页面

问题是：任何一个数据源慢，整个页面就慢。200ms 的数据库查询 + 2s 的外部 API = 每个用户至少等 2 秒才能看到首屏。

流式 SSR 的流程：

1. 请求进来
2. 服务器**立即**发送 HTML 外壳 + 快数据
3. 慢数据在解析完成后逐步流入
4. 浏览器逐步渲染每个区域

用户在毫秒级看到内容。慢数据随到随显。没有全页 loading。

## 三个核心组件

1. **分离快慢数据的 loader** —— `defer()` 标记哪些值需要流式传输
2. **组件中的 Suspense 边界** —— `<Await>` 包裹每个流式区域
3. **流式 SSR 运行时** —— 底层是 `renderToPipeableStream`

Pareto 把三者组合在一起。来看一个完整示例。

## 构建一个流式仪表板

假设一个仪表板展示：
- **用户数量**（快——缓存，~5ms）
- **活动列表**（中等——数据库查询，~100ms）
- **分析图表**（慢——外部 API，~800ms）

### Loader

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  // 快：先解析再传入 defer
  const userCount = await getCachedUserCount()

  return defer({
    userCount,  // 已解析——包含在初始 HTML

    // 中等：初始 HTML 后 ~100ms 流入
    activityFeed: db.query('SELECT * FROM activity ORDER BY created_at DESC LIMIT 20'),

    // 慢：初始 HTML 后 ~800ms 流入
    analytics: fetch('https://analytics-api.example.com/dashboard')
      .then(res => res.json()),
  })
}
```

`defer()` 接收一个对象。同步解析的值（如 `userCount`）包含在初始 HTML 中。Promise（如 `activityFeed` 和 `analytics`）在解析完成后流入。

### 页面组件

```tsx
// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function Dashboard() {
  const { userCount, activityFeed, analytics } = useLoaderData()

  return (
    <div className="dashboard">
      {/* 立即渲染——数据已经解析 */}
      <header>
        <h1>Dashboard</h1>
        <span className="stat">{userCount} 活跃用户</span>
      </header>

      {/* ~100ms 后流入 */}
      <section>
        <h2>最近活动</h2>
        <Await resolve={activityFeed} fallback={<ActivitySkeleton />}>
          {(feed) => (
            <ul>
              {feed.map(item => (
                <li key={item.id}>{item.user} {item.action}</li>
              ))}
            </ul>
          )}
        </Await>
      </section>

      {/* ~800ms 后流入 */}
      <section>
        <h2>数据分析</h2>
        <Await resolve={analytics} fallback={<ChartSkeleton />}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </section>
    </div>
  )
}
```

### 用户看到什么

- **0ms：** HTML 外壳 + 顶部用户数量
- **~100ms：** 活动列表出现，替换骨架屏
- **~800ms：** 分析图表出现，替换骨架屏

对比传统 SSR：用户要等到 ~800ms（等最慢的数据源）才能看到任何内容，然后一次性全部显示。

## 流式数据的错误处理

当 deferred promise 被拒绝时，`<Await>` 组件会抛出错误，最近的错误边界捕获它。

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => (
  <div className="error-card">
    <p>分析数据加载失败：{error.message}</p>
    <button onClick={() => window.location.reload()}>重试</button>
  </div>
)}>
  <Await resolve={analytics} fallback={<ChartSkeleton />}>
    {(data) => <AnalyticsChart data={data} />}
  </Await>
</ParetoErrorBoundary>
```

关键：给每个 `<Await>` 套独立的错误边界。分析 API 挂了，页面其他部分（顶部、活动列表）不受影响。

## 什么时候不该用流式渲染

**不要流式传输 SEO 关键内容。** 搜索引擎爬虫可能不会执行 JavaScript 来揭示流式内容。SEO 关键数据应该在 loader 中同步返回。

**不要流式传输小数据。** 如果所有数据在 50ms 内解析完毕，流式传输的开销不值得。

**不要流式传输依赖数据。** 如果组件必须所有数据齐全才能渲染有意义的内容，单独 defer 每个数据只会创建多个 loading 动画：

```tsx
// 更好：一个 loading 状态替代三个骨架屏
export function loader() {
  const [users, posts, comments] = await Promise.all([
    getUsers(), getPosts(), getComments()
  ])
  return { users, posts, comments }
}
```

## 客户端导航：NDJSON 流式传输

初始页面加载时，流式 SSR 逐步传输 HTML。客户端导航呢？

在 Pareto 4.0 中，客户端导航使用 **NDJSON（换行符分隔的 JSON）流式传输**。点击 `<Link>` 时，客户端以流的形式获取 loader 数据——非延迟数据先到，延迟数据逐步流入。

Suspense 边界在首次加载和导航时行为完全一致。没有差异，不需要特殊处理。

## 高负载下的性能

流式 SSR 不仅改善用户体验——它改变了服务器处理并发请求的方式。

传统 SSR 在所有数据准备好之前一直占用响应。100 个并发连接下，如果每个请求等待 200ms 的 API 调用，服务器队列会迅速堆积。

流式 SSR 立即发送初始 HTML 并释放渲染线程。慢数据异步流入。这就是为什么 Pareto 在高负载下能维持 **2,022 streaming req/s**，而 Next.js 只有 **310 req/s**——6.5 倍的差距。

实际意义：一个每秒 2,000 请求的流式 SSR 仪表板，Pareto 需要 1 台服务器，Next.js 需要 7 台。

## 完整模式

```tsx
// loader.ts —— 分离快慢数据
import { defer } from '@paretojs/core'

export async function loader() {
  const fast = await getSyncData()   // 先解析
  return defer({
    fast,                            // 已解析——包含在初始 HTML
    slow: fetchExternalAPI(),        // Promise——流式传输
  })
}

// page.tsx —— 标准 React + Await
import { useLoaderData, Await } from '@paretojs/core'

export default function Page() {
  const { fast, slow } = useLoaderData()
  return (
    <div>
      <div>{fast.value}</div>
      <Await resolve={slow} fallback={<Skeleton />}>
        {(data) => <SlowSection data={data} />}
      </Await>
    </div>
  )
}

// head.tsx —— 带 loader 数据的 meta 标签
export default function Head({ loaderData }) {
  return <title>{loaderData.fast.title}</title>
}
```

不用 Server Components。不用 `"use client"`。不用框架黑魔法。就是 loader、React 和 Suspense。

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
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
