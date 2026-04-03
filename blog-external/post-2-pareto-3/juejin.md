# Pareto 3.0 发布：基于 Vite 7 的轻量级 React SSR 框架

> TL;DR：Pareto 3.0 彻底重写 — Rspack 换成 Vite 7，要求 React 19，精简路由约定，Immer 驱动的状态管理，新的 `ParetoErrorBoundary` 组件。立即体验：`npx create-pareto@latest my-app`

---

如果你用过 Next.js 或 Remix，你已经熟悉 React SSR 的模式：基于文件的路由、布局、loader、流式渲染。Pareto 给你相同的模式，但去掉了复杂性。没有 Server Components，没有框架锁定，没有配置迷宫。

Pareto 3.0 是框架追上愿景的版本：**构建快速 React 应用所需的一切，没有多余的东西。**

## 3.0 变了什么

### Vite 7 取代 Rspack

Pareto 2.x 使用 Rspack，需要分别配置客户端/服务端、Babel 和懒编译器。全部移除了。

Pareto 3.0 使用 **Vite 7**：

- **开发服务器瞬间启动** — 毫秒级就绪
- **原生 ESM** — 开发时不打包
- **React Fast Refresh** — 保留组件状态的 HMR
- **你的 Vite 插件直接可用** — PostCSS、Tailwind、MDX 等，无需框架封装
- **单一配置** — `pareto.config.ts` 中的 `configureVite()`

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

### React 19

Pareto 3.0 要求 React 19。你可以用 `use()`、Actions、`useOptimistic()` 和改进的 Suspense — 但没有 Server Components。Pareto 使用 loader 模式：你的组件是标准的 React，同时在服务端和客户端工作。

### 精简的路由约定

3.0 的约定文件：

| 文件 | 用途 |
|------|------|
| `page.tsx` | 路由组件 |
| `layout.tsx` | 包裹布局 |
| `loader.ts` | 服务端数据获取（新增！） |
| `head.tsx` | 路由级 title 和 meta 标签 |
| `not-found.tsx` | 404 页面 |
| `route.ts` | JSON API 端点 |

**新增：`loader.ts`** — 在独立文件中定义 loader，将数据获取逻辑与组件分离：

```ts
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: getDashboardStats() }
}
```

**变更：错误处理** — `error.tsx` 约定被移除。使用 `ParetoErrorBoundary` 组件 — 可以放在组件树的任意位置：

```tsx
import { ParetoErrorBoundary } from '@paretojs/core'

<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

### Immer 驱动的状态管理

`defineStore()` 现在使用 Immer。直接修改，得到不可变结果：

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore((set) => ({
  count: 0,
  increment: () => set((d) => { d.count += 1 }),  // Immer 使这变成不可变更新
}))
```

支持直接解构：`const { count, increment } = counterStore.useStore()`。SSR 序列化是自动的 — 无需手动写水合代码。

### 安全头

OWASP 推荐的安全头，开箱即用：

```ts
import { securityHeaders } from '@paretojs/core/node'

const config: ParetoConfig = {
  configureServer(app) {
    app.use(securityHeaders())
  },
}
```

## 流式 SSR — 核心特性

Pareto 存在的理由。立即发送页面骨架，慢数据解析后流式传输：

```tsx
import { defer, useLoaderData, Await } from '@paretojs/core'
import { Suspense } from 'react'

export function loader() {
  return defer({
    quickData: { total: 42 },           // 立即发送
    slowData: fetchFromDatabase(),       // 稍后流式传输
  })
}

export default function Page() {
  const { quickData, slowData } = useLoaderData()

  return (
    <div>
      <h1>{quickData.total} items</h1>
      <Suspense fallback={<Skeleton />}>
        <Await resolve={slowData}>
          {(data) => <DataTable rows={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

用户快速看到内容。慢数据渐进加载。没有全页面的 loading。

## 从 2.x 迁移

1. 安装 `@paretojs/core@3`，更新到 React 19
2. 移除 Rspack 配置，改用 `configureVite()`
3. 用 `ParetoErrorBoundary` 替换 `error.tsx` 文件
4. 用 Vite 开发服务器测试 loader

## 立即体验

```bash
npx create-pareto@latest my-app
cd my-app
npm install
npm run dev
```

打开 `http://localhost:3000`，编辑 `app/page.tsx`，完成。

---

**链接：**
- GitHub：https://github.com/childrentime/pareto
- 文档：https://paretojs.dev
- 完整发布说明：https://paretojs.dev/blog/pareto-3/

---

*Pareto 是 MIT 协议的开源项目。如果觉得有用，请在 GitHub 上给个 Star。*
