---
title: 基于文件的路由
description: Pareto 如何将文件系统映射为 URL 路由。
---

Pareto 使用基于文件的路由。`app/` 目录下的每个 `page.tsx` 都会成为一个路由。

## 约定文件

| 文件 | 用途 |
|------|------|
| `page.tsx` | 路由组件 |
| `layout.tsx` | 包裹布局（从根到页面嵌套） |
| `loader.ts` | 独立的 loader 文件，用于服务端数据获取 |
| `head.tsx` | 路由级 `<title>` 和 meta 标签 |
| `not-found.tsx` | 404 页面（仅限根级） |
| `route.ts` | 资源路由（JSON API，无 HTML） |

## 路由映射

```
app/
  page.tsx              → /
  stream/
    page.tsx            → /stream
  blog/
    [slug]/
      page.tsx          → /blog/:slug
  api/
    users/
      route.ts          → /api/users (JSON)
```

## 动态路由

使用 `[param]` 目录名来定义动态段：

```
app/blog/[slug]/page.tsx  → /blog/:slug
```

通过 loader 上下文访问参数：

```tsx
export function loader(ctx: LoaderContext) {
  const { slug } = ctx.params
  return { post: getPost(slug) }
}
```

## 通配路由

使用 `[...param]` 实现通配段：

```
app/docs/[...path]/page.tsx  → /docs/*
```

## 嵌套布局

每一级的布局会包裹其子组件。根级 `layout.tsx` 包裹所有页面：

```
app/
  layout.tsx            ← 包裹所有内容
  page.tsx              ← / (被根布局包裹)
  dashboard/
    layout.tsx          ← 包裹 dashboard 页面
    page.tsx            ← /dashboard (被两层布局包裹)
    settings/
      page.tsx          ← /dashboard/settings (被两层布局包裹)
```

## 独立 loader 文件

你可以在独立的 `loader.ts` 文件中定义路由的 loader，而不是从 `page.tsx` 中导出：

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

这样可以将数据获取逻辑与组件分离。如果同时存在 `loader.ts` 和 `page.tsx` 中的 `loader` 导出，`loader.ts` 优先。

## 路由分组

如果你想在路由之间共享布局但不添加 URL 段，使用括号包裹的目录名：

```
app/
  (marketing)/
    layout.tsx          ← 营销页面的共享布局
    page.tsx            ← / (没有 /marketing 前缀)
    about/
      page.tsx          ← /about
  (dashboard)/
    layout.tsx          ← 仪表盘页面的共享布局
    overview/
      page.tsx          ← /overview
```

## 路由级元数据

每个路由可以通过 `head.tsx` 文件定义自己的 `<title>` 和 meta 标签。详见 [Head 管理](/zh/concepts/head-management/)。

## 错误处理

在布局或页面中使用 [`ParetoErrorBoundary`](/zh/concepts/error-handling/) 捕获渲染错误。你可以在任意层级放置错误边界，实现细粒度的错误隔离。
