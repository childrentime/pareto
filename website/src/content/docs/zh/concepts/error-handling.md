---
title: 错误处理
description: 使用 ParetoErrorBoundary 在布局和页面中捕获渲染错误。
---

Pareto 提供了 `ParetoErrorBoundary`，一个 React 错误边界组件，你可以将它放置在组件树的任意位置。它会捕获子组件的错误，并渲染备用 UI，而不是让整个页面崩溃。

## ParetoErrorBoundary

从 `@paretojs/core` 导入 `ParetoErrorBoundary`，包裹可能抛出错误的 UI 部分：

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>出了点问题</h2>
      <p>{error.message}</p>
    </div>
  )
}

export default function Page() {
  return (
    <ParetoErrorBoundary fallback={ErrorFallback}>
      <RiskyComponent />
    </ParetoErrorBoundary>
  )
}
```

`fallback` 属性接受一个 React 组件，该组件接收 `error` 属性，包含抛出的 `Error` 对象。

## 在布局中使用

一种常见模式是在根布局中包裹页面内容，这样任何页面的错误都不会破坏导航：

```tsx
// app/layout.tsx
import { ParetoErrorBoundary } from '@paretojs/core'
import type { PropsWithChildren } from 'react'

function GlobalError({ error }: { error: Error }) {
  return (
    <div>
      <h2>出了点问题</h2>
      <p>{error.message}</p>
      <a href="/">返回首页</a>
    </div>
  )
}

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header>My App</header>
      <main>
        <ParetoErrorBoundary fallback={GlobalError}>
          {children}
        </ParetoErrorBoundary>
      </main>
    </>
  )
}
```

因为错误边界在布局内部，即使页面抛出错误，页头仍然可见 — 用户可以在不完全刷新页面的情况下导航离开。

## 嵌套错误边界

你可以嵌套多个 `ParetoErrorBoundary` 组件。错误会冒泡到最近的边界：

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      <ParetoErrorBoundary fallback={ChartError}>
        <RevenueChart />
      </ParetoErrorBoundary>

      <ParetoErrorBoundary fallback={TableError}>
        <UserTable />
      </ParetoErrorBoundary>
    </div>
  )
}
```

如果 `RevenueChart` 抛出错误，只有该部分显示错误备用界面。`UserTable` 保持可交互。

## Loader 错误

当 loader 抛出错误时，服务器返回错误响应。你可以使用 [`notFound()`](/zh/concepts/redirects/) 或 [`redirect()`](/zh/concepts/redirects/) 来处理预期的情况：

```tsx
export function loader(ctx: LoaderContext) {
  const user = await getUser(ctx.params.id)
  if (!user) throw notFound()  // 渲染 not-found.tsx，返回 404 状态码
  return { user }
}
```

对于意外的 loader 失败，错误会传播到组件树中最近的 `ParetoErrorBoundary`。

## 恢复

你的错误备用组件可以包含重试按钮：

```tsx
function ErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>出了点问题</h2>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>
        重试
      </button>
    </div>
  )
}
```
