---
title: 流式 SSR
description: 使用 defer() 和 Await 通过 Suspense 边界流式传输数据。
---

Pareto 通过 `defer()` 和 `<Await>` 支持流式 SSR。立即发送页面骨架，然后在慢数据解析后流式传输。

## 基本用法

```tsx
import { defer, useLoaderData, Await } from '@paretojs/core'
import { Suspense } from 'react'

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

      <Suspense fallback={<Skeleton />}>
        <Await resolve={slowData}>
          {(data) => <DataTable rows={data} />}
        </Await>
      </Suspense>

      <Suspense fallback={<Skeleton />}>
        <Await resolve={slowerData}>
          {(data) => <Chart data={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

## 工作原理

1. Loader 返回 `defer({ ... })`，其中包含已解析的值和 Promise 的混合
2. 服务器立即发送包含已解析值的 HTML 骨架
3. 当每个 Promise 解析时，React 将结果流式传输到页面中
4. `<Await>` 组件在 Promise 解析前显示 `fallback`，解析后渲染子组件

## 何时使用流式渲染

当你的数据有不同的加载速度时使用 `defer()`：

- **快速数据**（用户会话、缓存配置）→ 直接返回
- **慢速数据**（数据库查询、外部 API）→ 包裹为 Promise，让其流式传输

如果所有数据都很快，直接从 loader 返回即可 — 无需使用 `defer()`。

## 流式渲染中的错误处理

当延迟的 Promise 被拒绝时，`<Await>` 组件抛出错误，由最近的 React 错误边界捕获。你可以通过 `errorElement` 属性处理，或者用 [`ParetoErrorBoundary`](/zh/concepts/error-handling/) 包裹：

```tsx
<Suspense fallback={<Skeleton />}>
  <Await
    resolve={slowData}
    errorElement={<p>数据加载失败，请重试。</p>}
  >
    {(data) => <DataTable rows={data} />}
  </Await>
</Suspense>
```

如果没有提供 `errorElement`，错误会冒泡到最近的 [`ParetoErrorBoundary`](/zh/concepts/error-handling/)。建议在每个 `<Await>` 上提供 `errorElement`，这样失败只会影响对应的部分。
