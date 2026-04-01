---
title: 快速开始
description: 5 分钟创建你的第一个 Pareto 应用。
---

## 创建新项目

```bash
npx create-pareto@latest my-app
cd my-app
npm install
```

## 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。编辑 `app/page.tsx`，页面会通过 HMR 即时更新。

## 项目结构

```
my-app/
  app/
    layout.tsx        # 根布局（页头、导航、页脚）
    page.tsx          # 首页 (/)
    head.tsx          # 根级 meta 标签
    not-found.tsx     # 404 页面
    globals.css       # 全局样式 (Tailwind)
    stream/
      page.tsx        # /stream 路由
      head.tsx        # 路由级 meta 标签
    api/time/
      route.ts        # /api/time (JSON 端点)
  package.json
  tsconfig.json
  tailwind.config.js
```

## 你的第一个页面

`app/` 目录下的每个 `page.tsx` 都会成为一个路由：

```tsx
// app/page.tsx
import { useLoaderData } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return { message: 'Hello from the server!' }
}

export default function HomePage() {
  const data = useLoaderData<{ message: string }>()
  return <h1>{data.message}</h1>
}
```

## 添加布局

`layout.tsx` 包裹同级及下级的所有页面：

```tsx
// app/layout.tsx
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header>My App</header>
      <main>{children}</main>
    </>
  )
}
```

## 构建生产版本

```bash
npm run build   # 构建
npm run start   # 启动生产服务器
```

## 下一步

应用运行后，探索核心概念：

- **[基于文件的路由](/zh/concepts/routing/)** — 了解 `page.tsx`、`layout.tsx`、`loader.ts`、动态路由和通配路由的约定。
- **[流式 SSR](/zh/concepts/streaming/)** — 使用 `defer()` 和 `<Await>` 流式传输慢数据，不阻塞首屏加载。
- **[状态管理](/zh/concepts/state-management/)** — 使用 `defineStore()` 和 `defineContextStore()` 管理全局和按请求的状态。
- **[Head 管理](/zh/concepts/head-management/)** — 通过 `head.tsx` 为每个路由设置 `<title>` 和 meta 标签。
- **[错误处理](/zh/concepts/error-handling/)** — 使用 `ParetoErrorBoundary` 在布局和页面中捕获渲染错误。
- **[资源路由](/zh/concepts/resource-routes/)** — 使用 `route.ts` 创建 JSON API 端点。
- **[配置](/zh/api/config/)** — 通过 `pareto.config.ts` 自定义 Express 服务器、Vite 构建和 CLI 选项。
