---
title: 流式 SSR
description: 使用 defer() 和 Await 通过 Suspense 边界流式传输数据。
---

Pareto 通过 `defer()` 和 `<Await>` 支持流式 SSR。立即发送页面骨架，然后在慢数据解析后流式传输。这让用户获得快速的首屏渲染，同时较慢的数据在后台逐步加载。

![Pareto 中流式 SSR 的工作原理 — 服务器立即发送 HTML 骨架，然后在 Promise 解析后流式传输延迟数据。](/streaming-diagram.png)

## Pareto 中的流式 SSR 是如何工作的？

```tsx
import { defer, useLoaderData, Await } from '@paretojs/core'

export function loader() {
  const quickData = { total: 42 }

  return defer({
    quickData,                          // 立即发送
    slowData: fetchFromDatabase(),      // 稍后流式传输
    slowerData: fetchFromExternalAPI(), // 更晚流式传输
  })
}

export default function Page() {
  const { quickData, slowData, slowerData } = useLoaderData()

  return (
    <div>
      <h1>{quickData.total} items</h1>

      <Await resolve={slowData} fallback={<Skeleton />}>
        {(data) => <DataTable rows={data} />}
      </Await>

      <Await resolve={slowerData} fallback={<Skeleton />}>
        {(data) => <Chart data={data} />}
      </Await>
    </div>
  )
}
```

## 底层发生了什么？

1. Loader 返回 `defer({ ... })`，其中包含已解析的值和 Promise 的混合
2. 服务器立即发送包含已解析值的 HTML 骨架
3. 当每个 Promise 解析时，React 将结果流式传输到页面中
4. `<Await>` 组件显示其 `fallback` 属性的内容，直到 Promise 解析后渲染子组件

每个 `<Await>` 组件内部都会创建自己的 React `<Suspense>` 边界。当 Promise 解析时，React 会就地替换 fallback 内容，而不会触发完整的重新渲染。在客户端水合后，这与 React 用于懒加载组件的机制相同。

## 什么时候应该使用流式渲染？

当你的数据有不同的加载速度时使用 `defer()`：

- **快速数据**（用户会话、缓存配置）→ 直接返回
- **慢速数据**（数据库查询、外部 API）→ 包裹为 Promise，让其流式传输

如果所有数据都很快，直接从 loader 返回即可 — 无需使用 `defer()`。添加不必要的 `defer()` 调用只会增加复杂度而没有任何收益。

## 什么时候应该避免流式渲染？

流式渲染并不总是正确的选择。在以下情况下应避免使用 `defer()`：

- **SEO 关键内容** — 搜索引擎爬虫可能不会执行 JavaScript 来展示流式内容。如果某些数据必须出现在初始 HTML 中以利于 SEO，请直接从 loader 返回，而不是延迟它。
- **小数据量** — 如果总的数据获取时间低于约 50ms，流式传输的建立开销不值得。直接同步返回所有数据即可。
- **依赖数据** — 如果组件在没有所有数据的情况下无法渲染出有意义的内容，延迟单个数据片段会造成更差的体验（多个加载旋转器而不是一个）。在 loader 中等待所有 Promise 完成，然后返回解析后的结果。
- **[静态页面](/zh/concepts/ssg/)** — SSG 页面在构建时渲染。延迟数据没有意义，因为没有活跃的请求可以进行流式传输。对静态路由使用直接返回。

## 如何处理流式数据中的错误？

当延迟的 Promise 被拒绝时，`<Await>` 组件抛出错误，由最近的 React 错误边界捕获。用 [`ParetoErrorBoundary`](/zh/concepts/error-handling/) 包裹 `<Await>` 可以实现细粒度的错误隔离：

```tsx
<ParetoErrorBoundary fallback={({ error }) => <p>数据加载失败。</p>}>
  <Await resolve={slowData} fallback={<Skeleton />}>
    {(data) => <DataTable rows={data} />}
  </Await>
</ParetoErrorBoundary>
```

如果没有在特定的 `<Await>` 周围放置 `ParetoErrorBoundary`，错误会冒泡到最近的祖先错误边界。这意味着一个失败的延迟 Promise 可能会将整个页面替换为错误 UI。为了更好的用户体验，建议为每个 `<Await>` 包裹各自的 `ParetoErrorBoundary`，这样失败只会影响对应的部分。

参见[错误处理](/zh/concepts/error-handling/)了解更多关于错误边界的工作方式。
