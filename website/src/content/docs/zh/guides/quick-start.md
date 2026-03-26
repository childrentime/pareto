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
