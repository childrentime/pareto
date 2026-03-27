---
title: 静态站点生成 (SSG)
description: 零配置，在构建时预渲染页面。
---

Pareto 支持静态站点生成。将任意页面标记为静态，它将在构建时预渲染为 HTML。

## 如何让页面变成静态的？

导出一个带有 `render: 'static'` 的 `config` 对象：

```tsx
// app/page.tsx
import type { RouteConfig } from '@paretojs/core'

export const config: RouteConfig = { render: 'static' }

export function loader() {
  return { version: '3.0.0' }
}

export default function HomePage() {
  const data = useLoaderData()
  return <h1>v{data.version}</h1>
}
```

页面在构建时渲染一次，然后作为静态 HTML 提供服务。

## 如何生成动态静态页面？

对于动态路由，导出 `staticParams()` 来生成所有路径：

```tsx
// app/blog/[slug]/page.tsx
export const config: RouteConfig = { render: 'static' }

export async function staticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

## 什么时候应该使用 SSG？

- **营销页面** — 内容很少变化，受益于快速的 TTFB
- **文档** — 构建时预渲染，通过 CDN 分发
- **博客文章** — 不需要按请求渲染的静态内容

对于包含用户特定数据或频繁变化内容的页面，使用 SSR（默认模式）。你可以在同一个应用中自由混合 SSR 和 SSG — 一些页面可以是静态的，而其他页面则在每次请求时渲染。

## Pareto 支持 ISR 或重新验证吗？

Pareto 目前不支持增量静态再生（ISR）— 页面在构建时生成一次，直到下次构建才会更新。如果你需要内容在不完全重新构建的情况下更新，请使用 SSR 而不是 SSG。你可以在服务器上添加 `Cache-Control` 头来在 CDN 层缓存 SSR 响应，这能实现与 ISR 类似的效果。

要添加缓存头，在生产服务器中应用 Express 中间件：

```ts
import express from 'express'

const app = express()
app.use('/blog', (req, res, next) => {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')
  next()
})
```

## 可以同时使用流式渲染和 SSG 吗？

[流式 SSR](/zh/concepts/streaming/)（`defer()`）与 SSG 不兼容。静态页面在构建时完全渲染，因此没有活跃的 HTTP 连接来流式传输延迟数据。如果静态页面的 loader 返回了 `defer()`，所有 Promise 会在构建期间被等待并解析 — 页面不会进行流式传输。
