---
title: 介绍
description: Pareto 是什么，为什么选择它而不是 Next.js 或 Remix。
---

Pareto 是一个基于 Vite 7 构建的轻量级 React SSR 框架。它提供了流式服务端渲染、基于文件的路由和内置状态管理 — 没有大型框架的复杂性。

## 为什么选择 Pareto？

如果你使用过 Next.js 或 Remix，你已经熟悉这些模式了。Pareto 使用相同的约定 — `page.tsx`、`layout.tsx`、`head.tsx` — 但去除了复杂性：

- **无 Server Components** — 只有普通的 React 组件加上数据 loader
- **无框架锁定** — 标准的 Express 服务器，标准的 Vite 构建
- **无配置迷宫** — 一个 `pareto.config.ts` 文件，合理的默认值
- **内置状态管理** — `defineStore()` 配合 Immer 变更，无需额外依赖

## 功能概览

| 功能 | 描述 |
|------|------|
| **SSR 与流式渲染** | `defer()` + `<Await>` 实现渐进式数据加载 |
| **基于文件的路由** | `page.tsx`、`layout.tsx`、`loader.ts`、`head.tsx`、`not-found.tsx` |
| **状态管理** | `defineStore()` 配合 Immer — 支持解构、SSR 序列化 |
| **错误边界** | `ParetoErrorBoundary` 组件捕获渲染错误 |
| **重定向与 404** | 在 loader 中使用 `throw redirect()` 和 `throw notFound()` |
| **资源路由** | `route.ts` 文件用于 JSON API 端点 |
| **Head 管理** | 通过 `head.tsx` 为每个路由设置 `<title>` 和 meta 标签 |
| **Vite 7** | HMR、代码分割、Tree Shaking、React Fast Refresh |

## 工作原理

1. **请求到达** — Express 将请求路由到 Pareto 的请求处理器
2. **Loader 执行** — `export function loader()` 在服务端获取数据
3. **SSR 流式输出** — React 渲染为流，立即发送页面骨架
4. **延迟数据流入** — 通过 `defer()` 包裹的 Promise 解析后流式传输到客户端
5. **客户端水合** — React 接管页面，启用交互和客户端导航
