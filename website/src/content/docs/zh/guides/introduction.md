---
title: 介绍
description: Pareto 是什么，为什么选择它而不是 Next.js 或 Remix。
---

Pareto 是一个基于 Vite 7 构建的轻量级 React SSR 框架。它提供了流式服务端渲染、基于文件的路由和内置状态管理 — 没有大型框架的复杂性。

## 为什么选择 Pareto？

如果你使用过 Next.js 或 Remix，你已经熟悉这些模式了。Pareto 使用相同的约定 — `page.tsx`、`layout.tsx`、`head.tsx` — 但去除了复杂性：

- **无 Server Components** — 只有普通的 React 组件加上数据 loader。每个组件在服务端和客户端都能工作，无需特殊指令或 `"use client"` 注解。
- **无框架锁定** — 标准的 Express 服务器，标准的 Vite 构建。你可以添加任何 Express 中间件，Vite 插件按预期工作。
- **无配置迷宫** — 一个 [`pareto.config.ts`](/zh/api/config/) 文件，合理的默认值。大多数项目无需任何配置即可开始。
- **内置状态管理** — [`defineStore()`](/zh/concepts/state-management/) 配合 Immer 变更，无需额外依赖。支持直接解构、SSR 序列化和 Context 作用域 Store。

## 功能概览

| 功能 | 描述 |
|------|------|
| **SSR 与流式渲染** | `defer()` + `<Await>` 实现渐进式数据加载 |
| **基于文件的路由** | `page.tsx`、`layout.tsx`、`loader.ts`、`head.tsx`、`not-found.tsx` |
| **状态管理** | `defineStore()` 配合 Immer — 支持解构、SSR 序列化 |
| **错误处理** | `ParetoErrorBoundary` 组件级错误捕获，`error.tsx` 应用级错误页面 |
| **重定向与 404** | 在 loader 中使用 `throw redirect()` 和 `throw notFound()` |
| **资源路由** | `route.ts` 文件用于 JSON API 端点，支持 `action` 导出 |
| **Head 管理** | 通过 `head.tsx` 为每个路由设置 `<title>` 和 meta 标签，自动去重 |
| **[文档定制](/zh/concepts/document-customization/)** | `document.tsx` 的 `getDocumentProps()` 设置 `<html>` 属性 |
| **安全头** | 生产环境自动应用 OWASP 基线安全头 |
| **Vite 7** | HMR、代码分割、Tree Shaking、React Fast Refresh |

## 工作原理

1. **请求到达** — Express 将请求路由到 Pareto 的请求处理器
2. **路由匹配** — 基于文件的路由表匹配 URL，支持动态段和通配段
3. **Loader 执行** — `export function loader()` 在服务端获取数据。Loader 可以 `throw redirect()` 或 `throw notFound()`
4. **Head 解析** — 从根到页面的 `head.tsx` 文件逐层渲染、去重、合并
5. **SSR 流式输出** — React 通过 `renderToPipeableStream` 渲染为流，立即发送 HTML 骨架
6. **延迟数据流入** — 通过 `defer()` 包裹的 Promise 解析后，以 `<script>` 标签流式注入客户端水合数据
7. **客户端水合** — `hydrateRoot` 接管页面，页面组件懒加载。后续导航通过 `/__pareto/data` 获取数据（JSON 或 NDJSON 流式传输延迟数据）

这种架构意味着用户能快速看到有意义的内容（骨架立即渲染），而较慢的数据在后台逐步加载，不阻塞首屏渲染。Loader 模式将数据获取保留在服务端，组件保持简洁，API 密钥不会暴露。

## 架构概览

Pareto 的构建和运行时围绕三个阶段设计：

### 构建阶段

`pareto build` 扫描 `app/` 目录发现路由，然后执行两次 Vite 构建：

- **客户端构建** — 生成代码分割的 JS 包，每个 `page.tsx` 是一个按需加载的独立 chunk。Vite manifest 映射路由到其 JS/CSS 资源。
- **服务端构建** — 生成单个 CJS 包，静态导入所有路由模块并创建 Express 请求处理器。

构建输出中嵌入了 `RouteManifest`，使 `<Link>` 组件能够在用户导航前预取目标路由的资源。

### 服务端运行时

每个请求流经 `createRequestHandler`：

1. 将 URL 与路由表匹配（优先级：静态 → 动态 → 通配）
2. 资源路由（`route.ts`）直接返回 JSON — 无 React 渲染
3. 页面路由经过 loader → head 解析 → 布局包裹 → `renderToPipeableStream` 管道
4. 客户端导航请求 `/__pareto/data` 端点，返回 JSON 或 NDJSON（当 loader 使用 `defer()` 时流式传输）

### 客户端运行时

`startClient` 调用 `hydrateRoot` 并设置客户端路由器：

- **首次加载** — 从 SSR HTML 中读取 `window.__ROUTE_DATA__`、`__ROUTE_MANIFEST__`、`__MATCHED_ROUTE__`
- **导航** — `<Link>` 和 `useRouter().push()` 从服务端获取路由数据，更新路由上下文，懒加载新页面组件
- **预取** — `<Link prefetch="hover">`（默认）或 `prefetch="viewport"` 使用路由 manifest 在导航前 `modulepreload` JS/CSS chunk
- **延迟数据** — 首次 SSR 时通过 `<script>` 注入流式传输；客户端导航时通过 NDJSON 流式传输

## 常见问题

### Pareto 与 Next.js 有什么不同？

Next.js 是一个功能齐全的框架，包含 Server Components、App Router、Edge Runtime 以及自有的部署平台（Vercel）。Pareto 的定位刻意更小。它使用普通的 React 组件（无 Server Components），运行在标准 Express 服务器上，使用 Vite 而非 Webpack/Turbopack 构建。如果你需要一个"电池全包"的平台，用 Next.js。如果你需要一个轻量级 SSR 框架，由你来掌控服务器和构建流程，Pareto 更合适。

### Pareto 支持 TypeScript 吗？

是的。每个 Pareto 项目都以 TypeScript 为第一优先。`create-pareto` 脚手架会生成带有正确 `tsconfig.json` 配置的 TypeScript 项目，所有 Pareto API 都导出其类型。Loader 函数接收类型化的 [`LoaderContext`](/zh/api/core/)，`defineStore()` 创建的 Store 自动推断类型。

### 可以使用已有的 React 组件吗？

可以。Pareto 使用标准的 React 19 — 任何在普通 React 应用中能工作的组件都能在 Pareto 中使用。没有特殊的组件类型或指令。你已有的 Hook、Context Provider 和第三方 UI 库都无需修改即可使用。

### React Server Components 呢？

Pareto 不使用 React Server Components（RSC）。它使用 loader 模式进行服务端数据获取：从页面文件导出 `loader()` 函数，返回的数据通过 `useLoaderData()` 供组件使用。这在服务端逻辑（loader）和客户端渲染（组件）之间保持了清晰的边界。

### 可以部署到任何地方吗？

可以。Pareto 生成标准的 Node.js 服务器（Express）。你可以部署到任何运行 Node.js 的地方：VPS、Docker 容器、AWS EC2/ECS、Google Cloud Run、Railway、Fly.io，或任何支持 Node 的托管平台。
