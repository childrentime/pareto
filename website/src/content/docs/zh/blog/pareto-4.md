---
title: Pareto 4.0
description: Pareto 4.0 — NDJSON 流式导航、head.tsx 组件约定、文档定制，以及 9 倍于 Next.js 的数据加载性能。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 3 月 31 日</p>

Pareto 4.0 聚焦两件事：让客户端导航和首次 SSR 渲染一样快，然后用数据证明。

核心特性是 NDJSON 流式导航、React 组件化的 `<head>` 管理和文档级定制。但真正的故事是我们现在有了[在 CI 中自动运行的基准测试](/zh/blog/benchmarks/)——Pareto 的数据加载吞吐量是 **Next.js 的 9.3 倍**，流式 SSR 负载能力是 **Next.js 的 6.5 倍**。

## NDJSON 流式导航

3.0 中，客户端导航通过单个 JSON 响应获取 loader 数据。浏览器必须等待整个 payload 才能开始渲染。4.0 中，导航使用 **NDJSON（换行符分隔的 JSON）流式传输**。

当你导航到一个使用 `defer()` 的页面时，客户端立即收到非延迟数据并开始渲染。延迟的值在解析完成后逐条流入——和首次 SSR 渲染相同的渐进式交付模型，现在应用于每一次客户端导航。

这意味着 Suspense 边界在首次加载和导航时行为完全一致。没有行为差异，不需要特殊处理。

## `head.tsx` 组件约定

Head 管理不再是描述符对象，而是 React 组件。

每个路由目录可以有一个 `head.tsx`，导出一个接收 `{ loaderData, params }` 的默认组件：

```tsx
// app/dashboard/head.tsx
export default function Head({ loaderData }: { loaderData: { title: string } }) {
  return (
    <>
      <title>{loaderData.title} — 仪表板</title>
      <meta name="description" content={`${loaderData.title} 的仪表板`} />
    </>
  )
}
```

Head 组件从根布局到页面逐层合并。重复的标签通过 `name`、`property` 或 `httpEquiv` 自动去重——最深层的路由优先。客户端导航时，Head 组件会重新渲染以保持 `<title>` 和 `<meta>` 同步，无需整页刷新。

## 文档定制

新的 `document.tsx` 约定允许你自定义 HTML 外壳：

```tsx
// app/document.tsx
import type { DocumentContext } from '@paretojs/core'

export function getDocumentProps(ctx: DocumentContext) {
  const lang = ctx.url.startsWith('/zh') ? 'zh-CN' : 'en'
  return { lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }
}
```

返回的属性会应用到 `<html>` 元素。适用于 i18n、RTL 支持或任何按请求变化的 HTML 属性。

## 性能数据

我们构建了完整的基准测试套件，在每个 PR 上自动运行。

**吞吐量**（100 并发连接，30 秒持续）：

- 数据加载：Pareto **2,733/s** vs Next.js 293/s（**9.3 倍**）
- API / JSON：Pareto **3,675/s** vs Next.js 2,212/s（**1.7 倍**）
- 流式 SSR：Pareto **247/s**，各框架基本持平

**最大可持续 QPS**（1→1,000 并发连接，p99 < 500ms）：

- 流式 SSR：Pareto **2,022/s** vs Next.js 310/s（**6.5 倍**）
- 数据加载：Pareto **2,735/s** vs Next.js 331/s（**8.3 倍**）

具体来说：如果你的数据加载页面需要在高峰期处理 2,000 req/s，Pareto 需要 1 台服务器，Next.js 需要 6 台。流式 SSR 仪表板场景下，1 台 vs 7 台。更少的基础设施，更低的成本，更少的故障点。

**客户端 JS 产物**：62 KB gzip 后——约为 Next.js（233 KB）的 1/4。在 4G 移动网络下，下载时间约 100ms vs 370ms。每一毫秒都影响跳出率。

完整数据请参阅[性能基准测试博客](/zh/blog/benchmarks/)。

## 4.0 其他变更

- **`startProductionServer()`** — `@paretojs/core/node` 新增导出，简化生产服务器启动，内置静态文件服务、压缩和安全头。
- **默认错误兜底** — 未定义自定义错误边界时提供内置的错误兜底组件。
- **路由模式缓存** — 客户端路由匹配使用预编译的正则缓存，加速导航。
- **`wkWebViewFlushHint`** — 配置项，强制 iOS WKWebView 在流完成前绘制初始外壳。

## 破坏性变更

- `HeadDescriptor` / `HeadFunction` 替换为 `head.tsx` 组件
- `hydrateApp()` 移除 — 使用 `startClient()`
- `RouterProvider` 不再导出 — 由框架内部管理
- `createStoreApi()` 移除 — 使用 `@paretojs/core/store` 的 `defineStore()`
- `dehydrate()` / `getHydrationData()` / `hydrateStores()` 移除 — 水合现在完全自动
- Barrel files 移除 — 直接从源模块导入

完整迁移细节请参阅 [changelog](https://github.com/childrentime/pareto/blob/main/CHANGELOG.md)。

## 开始使用

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

<style>
{`
  .blog-meta {
    font-size: 0.875rem;
    color: var(--sl-color-gray-3);
    margin-bottom: 2rem;
  }
  .blog-meta a {
    color: var(--sl-color-accent);
  }
`}
</style>
