# 5 分钟用 Vite SSR 搭建一个全栈 React 应用

Vite 是 JavaScript 生态中最快的开发服务器。但用它做 SSR 一直意味着自己接 `renderToPipeableStream`、配置 client/server 构建、处理 hydration。

[Pareto](https://github.com/childrentime/pareto) 是基于 Vite 7 的 React SSR 框架，帮你处理好这一切。文件路由、流式 SSR、loader、状态管理、62 KB 的客户端包——零配置。

5 分钟，从零到一个全栈 React 应用。

## 1. 创建项目（30 秒）

```bash
npx create-pareto@latest my-app
cd my-app
npm install
npm run dev
```

打开 http://localhost:3000。编辑 `app/page.tsx`，通过 Vite 的 HMR 即时热更新。

## 2. 理解项目结构（30 秒）

```
my-app/
  app/
    layout.tsx        # 根布局（header、nav、footer）
    page.tsx          # 首页 (/)
    head.tsx          # 根 <title> 和 meta 标签
    not-found.tsx     # 404 页面
    globals.css       # 全局样式
  pareto.config.ts    # 框架配置（可选）
  package.json
  tsconfig.json
```

`app/` 下任何包含 `page.tsx` 的目录就是一个路由。嵌套目录创建嵌套路由。就这样。

## 3. 创建带服务端数据的页面（1 分钟）

在 `/posts` 创建新路由：

```tsx
// app/posts/loader.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  // 只在服务端运行
  return {
    posts: [
      { id: 1, title: 'Hello World', body: '第一篇文章' },
      { id: 2, title: 'Vite SSR', body: '真的很快' },
    ],
  }
}
```

```tsx
// app/posts/page.tsx
import { useLoaderData } from '@paretojs/core'

interface Post {
  id: number
  title: string
  body: string
}

export default function PostsPage() {
  const { posts } = useLoaderData<{ posts: Post[] }>()

  return (
    <div>
      <h1>文章列表</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <h2>{post.title}</h2>
            <p>{post.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

```tsx
// app/posts/head.tsx
export default function Head() {
  return (
    <>
      <title>文章 — My App</title>
      <meta name="description" content="所有博客文章" />
    </>
  )
}
```

访问 http://localhost:3000/posts。Loader 在服务端运行，HTML 是服务端渲染的，客户端 hydrate。查看源码——文章内容就在 HTML 里。

## 4. 为慢数据添加流式渲染（1 分钟）

真实应用需要查数据库、调 API。有些快，有些慢。用 `defer()` 流式传输慢数据，不阻塞页面：

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

async function getQuickStats() {
  return { users: 1_234, pageViews: 56_789 }
}

async function getSlowAnalytics() {
  // 模拟一个慢 API 调用
  await new Promise((r) => setTimeout(r, 2000))
  return { topPage: '/posts', bounceRate: 0.42 }
}

export async function loader() {
  const stats = await getQuickStats()  // 先解析快数据
  return defer({
    stats,                               // 已解析——包含在初始 HTML
    analytics: getSlowAnalytics(),       // Promise——后续流式传输
  })
}
```

```tsx
// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function DashboardPage() {
  const { stats, analytics } = useLoaderData()

  return (
    <div>
      <h1>仪表板</h1>
      <p>{stats.users} 用户 · {stats.pageViews} 页面浏览</p>

      <Await resolve={analytics} fallback={<p>加载分析数据...</p>}>
        {(data) => (
          <div>
            <p>热门页面：{data.topPage}</p>
            <p>跳出率：{(data.bounceRate * 100).toFixed(0)}%</p>
          </div>
        )}
      </Await>
    </div>
  )
}
```

访问 http://localhost:3000/dashboard。统计数据立即显示。分析数据 2 秒后流入。页面从不阻塞。

## 5. 添加客户端导航（30 秒）

用 `<Link>` 实现 SPA 风格的导航：

```tsx
// app/layout.tsx
import type { PropsWithChildren } from 'react'
import { Link } from '@paretojs/core'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/posts">文章</Link>
        <Link to="/dashboard">仪表板</Link>
      </nav>
      <main>{children}</main>
    </>
  )
}
```

点击即时导航。Loader 数据通过 NDJSON 流式获取——延迟数据逐步流入，和初始 SSR 渲染行为一致。

## 6. 添加状态管理（30 秒）

Pareto 内置 `defineStore()`，集成 Immer——不需要额外依赖：

```tsx
// app/stores/theme.ts
import { defineStore } from '@paretojs/core/store'

export const themeStore = defineStore((set) => ({
  mode: 'light' as 'light' | 'dark',
  toggle: () => set((d) => {
    d.mode = d.mode === 'light' ? 'dark' : 'light'
  }),
}))
```

```tsx
// 在任何组件中使用
import { themeStore } from '../stores/theme'

function ThemeToggle() {
  const { mode, toggle } = themeStore.useStore()
  return <button onClick={toggle}>主题：{mode}</button>
}
```

状态在 SSR 期间自动序列化，客户端自动 hydrate。零样板代码。

## 7. 添加 API 端点（30 秒）

创建 `route.ts` 文件来定义 JSON API 端点：

```tsx
// app/api/time/route.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  return { time: new Date().toISOString() }
}
```

GET http://localhost:3000/api/time 返回 `{"time":"2026-04-03T..."}`。标准 REST 端点，无需额外配置。

## 8. 构建和部署（1 分钟）

```bash
npm run build
npm run start
```

你的生产服务器是标准 Node.js 进程，跑 Express + Vite 优化后的构建产物。部署到任何地方：Docker、Fly.io、Railway、VPS、Kubernetes。

不需要特殊托管。不需要 serverless 运行时兼容。不锁定供应商。

## 你刚刚构建了什么

5 分钟内，你拥有了：

- **文件路由** — 目录映射为路由
- **服务端渲染** — 首次加载完整 HTML，利好 SEO
- **流式 SSR** — 慢数据不阻塞页面
- **客户端导航** — SPA 体验 + NDJSON 流式传输
- **Head 管理** — 每个路由独立的 title 和 meta 标签
- **状态管理** — Immer 驱动的 store，SSR hydration 全自动
- **API 端点** — JSON 路由和页面共存
- **TypeScript** — 全链路类型安全
- **62 KB 客户端包** — 比 Next.js 小 73%

全部基于 Vite 7——即时启动开发服务器、React Fast Refresh、原生 ESM。

## 为什么选 Vite 做 SSR？

Vite 的原生 ESM 开发服务器意味着开发时零打包。你的 100 个路由的应用启动速度和 1 个路由一样快。对比基于 Webpack 的框架，开发服务器启动时间随项目规模线性增长。

插件生态是另一个优势——PostCSS、Tailwind、MDX 以及数百个 Rollup/Vite 插件开箱即用，不需要框架包装层。

## 下一步

- [路由文档](https://paretojs.tech/concepts/routing/) — 动态路由、catch-all 路由、嵌套布局
- [流式 SSR 文档](https://paretojs.tech/concepts/streaming/) — 何时使用 defer()、错误处理
- [状态管理文档](https://paretojs.tech/concepts/state-management/) — defineStore、defineContextStore
- [基准测试](https://paretojs.tech/blog/benchmarks/) — Pareto vs Next.js vs React Router 性能数据

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

[Pareto](https://github.com/childrentime/pareto) — 轻量级流式 React SSR 框架 | [文档](https://paretojs.tech)
