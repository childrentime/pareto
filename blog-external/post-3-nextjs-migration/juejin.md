# 从 Next.js 迁移到 Pareto：哪些变了，哪些没变

你熟悉 Next.js，熟悉文件路由、布局、SSR。你大概也熟悉那些痛点：Server Components vs Client Components，满屏的 `"use client"`，莫名其妙的 hydration 错误，还有你一行业务代码没写就已经 233 KB 的客户端包。

[Pareto](https://github.com/childrentime/pareto) 提供同样的 SSR 模式——但没有这些复杂性。标准 React 组件，Vite 替代 Webpack/Turbopack，客户端包只有 62 KB。这篇文章详细对比从 Next.js 切到 Pareto 时，什么变了，什么不变。

## 心智模型的转变

**Next.js（App Router）：** 每个组件默认是 Server Component。想用 `useState`？加 `"use client"`。数据获取通过 async server component 或者 `generateMetadata`。你无时无刻不在思考 server/client 边界。

**Pareto：** 每个组件都是普通 React 组件，同时运行在服务端和客户端。数据获取在 `loader.ts` 文件中完成——借鉴了 Remix 的模式。没有 `"use client"` 指令，因为根本不存在 Server Component / Client Component 的划分。

```
Next.js 心智模型：  "这是 Server Component 还是 Client Component？"
Pareto 心智模型：   "这是数据还是 UI？"
```

## 路由：几乎一模一样

如果你熟悉 Next.js App Router 的约定，Pareto 的路由会立刻上手：

| Next.js | Pareto | 用途 |
|---------|--------|------|
| `page.tsx` | `page.tsx` | 路由组件 |
| `layout.tsx` | `layout.tsx` | 包裹布局 |
| — | `loader.ts` | 服务端数据获取 |
| `loading.tsx` | Suspense + `<Await>` | 加载状态 |
| `error.tsx` | `ParetoErrorBoundary` | 错误处理 |
| `not-found.tsx` | `not-found.tsx` | 404 页面 |
| `route.ts` | `route.ts` | API 端点 |
| `generateMetadata` | `head.tsx` | Meta 标签 |

最大的区别：Pareto 用独立的 `loader.ts` 文件做数据获取，而不是把页面组件变成 async。

## 数据获取：loader 替代 async 组件

**Next.js（App Router）：**

```tsx
// app/dashboard/page.tsx（server component）
export default async function Dashboard() {
  const stats = await db.getStats()
  return <h1>{stats.total} users</h1>
}
```

**Pareto：**

```tsx
// app/dashboard/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { stats: db.getStats() }
}

// app/dashboard/page.tsx
import { useLoaderData } from '@paretojs/core'

export default function Dashboard() {
  const { stats } = useLoaderData<{ stats: { total: number } }>()
  return <h1>{stats.total} users</h1>
}
```

两个文件替代一个，但分离是有意为之：数据获取是显式的、可测试的，永远不与渲染逻辑混在一起。组件是标准 React——没有 `async`，没有 `await`，没有 server-only 限制。

## 流式渲染：`defer()` 替代 Suspense 体操

**Next.js：** 流式渲染需要把页面拆分成 server 和 client 组件，协调 `loading.tsx` 边界，理解哪些组件会阻塞首次渲染。

**Pareto：** 在 loader 中调用 `defer()`，用 `<Await>` 包裹慢数据。搞定。

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

export async function loader() {
  const userCount = await getUserCount()  // 先解析快数据

  return defer({
    userCount,                             // 已解析——立即发送
    activityFeed: getActivityFeed(),       // 慢——流式传输
    analytics: getAnalytics(),             // 更慢——稍后流式传输
  })
}

// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function Dashboard() {
  const { userCount, activityFeed, analytics } = useLoaderData()

  return (
    <div>
      <h1>{userCount} users</h1>

      <Await resolve={activityFeed} fallback={<Skeleton />}>
        {(feed) => <ActivityList items={feed} />}
      </Await>

      <Await resolve={analytics} fallback={<ChartSkeleton />}>
        {(data) => <AnalyticsChart data={data} />}
      </Await>
    </div>
  )
}
```

每个 `<Await>` 创建独立的 Suspense 边界。快数据立即渲染，慢数据逐步流入。初始 SSR 和客户端导航行为一致（Pareto 4.0 通过 NDJSON 流式传输实现）。

## Head 管理：React 组件，不是配置对象

**Next.js：**

```tsx
export async function generateMetadata({ params }) {
  const post = await getPost(params.id)
  return { title: post.title, description: post.excerpt }
}
```

**Pareto：**

```tsx
// app/blog/[id]/head.tsx
export default function Head({ loaderData }: { loaderData: { post: Post } }) {
  return (
    <>
      <title>{loaderData.post.title}</title>
      <meta name="description" content={loaderData.post.excerpt} />
      <meta property="og:title" content={loaderData.post.title} />
    </>
  )
}
```

就是一个 React 组件。可以用条件逻辑、组合共享组件、渲染任何合法的 `<head>` 内容。Head 组件从根布局到页面依次合并——最深层路由的重复标签优先。

## 状态管理：内置，不是外挂

Next.js 对状态管理没有意见。你自己装 Redux、Zustand、Jotai，然后自己搞定 SSR hydration。

Pareto 内置 `defineStore()`，集成 Immer：

```tsx
import { defineStore } from '@paretojs/core/store'

const { useStore, getState, setState } = defineStore((set) => ({
  items: [] as CartItem[],
  total: 0,
  addItem: (item: CartItem) => set((d) => {
    d.items.push(item)
    d.total += item.price
  }),
}))
```

SSR hydration 全自动。服务端定义的状态自动序列化并在客户端恢复，不需要任何手动的 `dehydrate` / `rehydrate` 样板代码。

## 配置：一个文件

**Next.js：** `next.config.js` 框架配置 + 单独的 Webpack/Turbopack 定制 + 可能还有 `middleware.ts` + 环境变量约定。

**Pareto：** 一个 `pareto.config.ts`：

```ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  configureVite(config) {
    // 标准 Vite 配置——你的插件直接能用
    return config
  },
  configureServer(app) {
    // 标准 Express app——加任何中间件
    app.use(cors())
  },
}

export default config
```

没有框架魔法。底层就是 Vite 和 Express，完全可控。

## 性能差距

我们在 CI 中跑自动化基准测试，在相同硬件上对比 Pareto 和 Next.js：

- **数据加载吞吐量：** Pareto 2,733 req/s vs Next.js 293 req/s（**9.3 倍**）
- **流式 SSR 容量：** Pareto 2,022 req/s vs Next.js 310 req/s（**6.5 倍**）
- **客户端 JS 包：** 62 KB vs 233 KB（**小 73%**）

换算成基础设施：一个需要 2,000 req/s 的页面，Pareto 需要 1 台服务器，Next.js 需要 6 台。完整基准测试数据：[paretojs.tech/blog/benchmarks](https://paretojs.tech/blog/benchmarks/)

## 你会放弃什么

公开透明很重要。Pareto 没有的东西：

- **Server Components** — 没有 RSC，没有 `"use client"`。这是设计选择：loader 模式更简单，覆盖 95% 的场景。
- **图片优化** — 没有 `<Image>` 组件。用标准 `<img>` + CDN。
- **ISR / 静态生成** — Pareto 只做 SSR。没有构建时渲染。
- **中间件** — 没有 Edge Middleware。用 `configureServer()` 中的 Express 中间件替代。
- **Vercel 集成** — 没有一键部署。你部署的是标准 Node.js 服务器。
- **生态规模** — 更小的社区，更少的示例。你是早期用户。

如果你在做内容驱动的营销站需要 ISR，Next.js 仍然是对的选择。如果你在做数据驱动的应用、性能和简洁性很重要，Pareto 值得切换。

## 迁移清单

1. `npx create-pareto@latest my-app` — 创建新项目
2. 移动路由文件 — 目录结构几乎一样
3. 把 async server component 拆分为 `loader.ts` + 标准组件
4. 删掉 `"use client"` 指令 — 不需要了
5. 把 `generateMetadata` 迁移到 `head.tsx` 组件
6. 把 `loading.tsx` 替换为 `defer()` + `<Await>` 流式渲染
7. 把 `next/link` 换成 `@paretojs/core` 的 `Link`
8. 把 Webpack 配置迁移到 `pareto.config.ts` 的 `configureVite()`
9. 作为标准 Node.js 服务器部署

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

[Pareto](https://github.com/childrentime/pareto) — 轻量级流式 React SSR 框架 | [文档](https://paretojs.tech)
