---
title: 静态站点生成 (SSG)
description: 零配置，在构建时预渲染页面。
---

Pareto 支持静态站点生成。将任意页面标记为静态，它将在构建时预渲染为 HTML。

## 用法

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

## 动态静态路由

对于动态路由，导出 `staticParams()` 来生成所有路径：

```tsx
// app/blog/[slug]/page.tsx
export const config: RouteConfig = { render: 'static' }

export async function staticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}
```

## 何时使用 SSG

- **营销页面** — 内容很少变化，受益于快速的 TTFB
- **文档** — 构建时预渲染，通过 CDN 分发
- **博客文章** — 不需要按请求渲染的静态内容

对于包含用户特定数据或频繁变化内容的页面，使用 SSR（默认模式）。
