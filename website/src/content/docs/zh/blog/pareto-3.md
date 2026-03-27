---
title: Pareto 3.0
description: Pareto 3.0 发布 — 基于 Vite 7 重构，升级至 React 19，精简 API，提升开发体验。
template: splash
---

Pareto 3.0 是框架的一次彻底重构。构建系统、运行时、状态管理和 CLI 全部重写。这是我们一直在努力实现的版本：一个使用起来快、发布起来也快的轻量级 React SSR 框架。

## Vite 7 取代 Rspack

3.0 最大的变化是构建系统。Pareto 2.x 使用 Rspack（Webpack 兼容的打包器），需要分别配置客户端和服务端、Babel 转换和复杂的懒编译器。这些全部移除了。

Pareto 3.0 使用 **Vite 7** 作为构建引擎：

- **开发服务器瞬间启动** — Vite 的按需模块转换意味着开发服务器在毫秒内就绪。
- **开发环境原生 ESM** — 开发时不打包，模块直接提供给浏览器。
- **React Fast Refresh** — 保留组件状态的 HMR，由 `@vitejs/plugin-react` 驱动。
- **你的 Vite 插件直接可用** — PostCSS、Tailwind、MDX 等，无需框架特定的封装。
- **单一配置** — 通过 `pareto.config.ts` 中的 `configureVite()` 自定义构建。不再需要分别管理客户端和服务端的 Rspack 配置。

```ts
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  configureVite(config) {
    config.plugins.push(myVitePlugin())
    return config
  },
}

export default config
```

## React 19

Pareto 3.0 要求 **React 19**。你可以使用最新的 React 特性：

- **`use()` hook** — 在渲染中直接读取 Promise 和 Context。
- **Actions** — 与 Transition 集成的异步函数。
- **`useOptimistic()`** — React 内置的乐观 UI 更新。
- **改进的 Suspense** — 更好的流式渲染和水合行为。

没有 Server Components — Pareto 继续使用 loader 模式进行服务端数据获取。你的组件是标准的 React 组件，同时在服务端和客户端工作。

## 精简的路由约定

基于文件的路由系统进行了优化。3.0 的约定文件：

| 文件 | 用途 |
|------|------|
| `page.tsx` | 路由组件 |
| `layout.tsx` | 包裹布局（从根到页面嵌套） |
| `loader.ts` | 独立的 loader 文件，用于服务端数据获取 |
| `head.tsx` | 路由级 `<title>` 和 meta 标签 |
| `not-found.tsx` | 404 页面（仅限根级） |
| `route.ts` | 资源路由（JSON API，无 HTML） |

**新增：`loader.ts`** — 你现在可以在独立文件中定义 loader，而不需要从 `page.tsx` 中导出。这样可以将数据获取逻辑与组件分离：

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

**变更：错误处理** — 错误处理现在通过 `ParetoErrorBoundary` 组件实现，而不是 `error.tsx` 约定文件。这让你更灵活 — 在组件树中需要的地方精确放置错误边界：

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

## 状态管理改进

`defineStore()` 和 `defineContextStore()` 现在使用 **Immer** 进行不可变状态更新。你可以像直接修改一样编写 mutation — Immer 会产生不可变的结果：

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore((set) => ({
  count: 0,
  increment: () =>
    set((draft) => {
      draft.count += 1  // Immer 使这变成不可变更新
    }),
}))
```

Store API 支持直接解构、通过 `dehydrate()` / `hydrateStores()` 实现 SSR 序列化，以及 Context 作用域的 Store 用于每请求隔离。

## 安全头

Pareto 在开发环境中自动应用 OWASP 推荐的安全头。在生产环境中，`securityHeaders()` 从 `@paretojs/core/node` 导出，可用于自定义服务器配置：

```ts
import { securityHeaders } from '@paretojs/core/node'
import express from 'express'

const app = express()
app.use(securityHeaders())
```

自动设置 `X-Content-Type-Options`、`X-Frame-Options`、`X-XSS-Protection`、`Referrer-Policy` 和 `Permissions-Policy` 头。

## CLI 变更

CLI 命令保持不变，但底层从自定义解析器改为使用 `cac`：

```bash
pareto dev     # 带 HMR 的开发服务器
pareto build   # 生产构建（客户端 + 服务端 + 静态）
pareto start   # 启动生产服务器
```

## 从 2.x 迁移

1. **更新依赖** — 安装 `@paretojs/core@3` 并更新到 React 19。
2. **移除 Rspack 配置** — 删除自定义的 Rspack 配置文件，改用 `pareto.config.ts` 中的 `configureVite()`。
3. **替换 `error.tsx`** — 移除 `error.tsx` 文件，在布局/页面中使用 `ParetoErrorBoundary` 代替。
4. **更新导入** — `@paretojs/core` 的 API 大体不变，但请对照 [API 参考](/zh/api/core/) 检查导入。
5. **测试你的 loader** — Loader 行为未变，但需要验证数据获取在 Vite 开发服务器下正常工作。

现在就试试：

```bash
npx create-pareto@latest my-app
```
