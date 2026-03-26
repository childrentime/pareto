# Pareto

[English Version](./README.md)

基于 Vite 的轻量级 React SSR 框架 — 支持流式渲染、文件路由、客户端导航和内置状态管理。

## 快速开始

```bash
npx create-pareto my-app
cd my-app
npm install
npm run dev
```

或使用 pnpm:

```bash
pnpm create pareto my-app
```

## 特性

- **SSR & 流式渲染** — 即时服务端渲染页面。使用 `defer()` 通过 Suspense 边界流式传输慢数据。
- **SSG 静态生成** — 导出 `config = { render: 'static' }` 即可在构建时预渲染页面。
- **文件路由** — `page.tsx`、`layout.tsx`、`loader.ts`、`head.tsx`、`not-found.tsx` 约定。
- **动态路由** — `[param]`、`[...slug]`、`[[...optional]]` 支持动态 URL 匹配。
- **路由分组** — `(groupName)` 目录用于组织路由，不影响 URL 结构。
- **客户端导航** — `<Link>` 组件和 `useRouter()` Hook，支持预加载的 SPA 风格导航。
- **状态管理** — 基于 Immer 的响应式 Store。`defineStore()` 和 `defineContextStore()` 支持 SSR 序列化。
- **Head 管理** — 通过 `head.tsx` 设置每个路由的 `<title>` 和 meta 标签，嵌套 head 自动合并。
- **Resource Routes** — `route.ts` 文件直接返回 JSON（无 HTML 渲染）。
- **重定向 & 404** — 在 loader 中使用 `throw redirect('/login')` 和 `throw notFound()`。
- **安全头** — 内置 OWASP 基线安全头中间件。
- **环境变量** — 开箱即用的 `.env` / `.env.local` / `.env.{mode}` 支持。

## 项目结构

```
app/
  layout.tsx          # 根布局（包裹所有页面）
  page.tsx            # 首页 (/)
  head.tsx            # 根 head 标签
  not-found.tsx       # 404 页面
  blog/
    layout.tsx        # 博客布局（嵌套在根布局内）
    page.tsx          # /blog
    head.tsx          # 博客 head 标签
    [slug]/
      page.tsx        # /blog/:slug
      loader.ts       # 博客文章数据加载器
      head.tsx        # 动态 head 标签
  (auth)/
    login/
      page.tsx        # /login（分组不会产生 URL 段）
  api/time/
    route.ts          # /api/time（JSON 接口）
```

### 路由文件约定

| 文件 | 用途 |
|---|---|
| `page.tsx` | 页面组件 — 使目录成为一个路由 |
| `layout.tsx` | 布局包裹器 — 嵌套包裹子路由 |
| `loader.ts` | 服务端数据加载器 |
| `head.tsx` | 路由的 `<title>` 和 `<meta>` 标签 |
| `route.ts` | Resource route — 返回原始数据（无 HTML） |
| `not-found.tsx` | 404 页面（仅限 app 根目录） |

## Loader & 流式渲染

```tsx
// app/dashboard/loader.ts
import { defer } from '@paretojs/core'

export async function loader({ req, params }) {
  const stats = await db.getStats()
  return defer({
    stats,                        // 立即可用
    feed: db.getFeed(),           // 稍后流式传输
    comments: db.getComments(),   // 稍后流式传输
  })
}

// app/dashboard/page.tsx
import { useLoaderData, Await } from '@paretojs/core'

export default function Page() {
  const { stats, feed } = useLoaderData()
  return (
    <div>
      <h1>{stats.total} items</h1>
      <Await resolve={feed} fallback={<Skeleton />}>
        {(data) => <Feed items={data} />}
      </Await>
    </div>
  )
}
```

## 客户端导航

```tsx
import { Link, useRouter } from '@paretojs/core'

// 声明式导航，支持预加载
<Link href="/about">关于</Link>
<Link href="/blog/hello" prefetch="viewport">阅读文章</Link>
<Link href="/login" replace>登录</Link>

// 编程式导航
function MyComponent() {
  const { push, replace, back, pathname, isNavigating, prefetch } = useRouter()
  return <button onClick={() => push('/dashboard')}>前往</button>
}
```

预加载策略：`hover`（默认）、`viewport`、`none`。

## 状态管理

```tsx
import { defineStore } from '@paretojs/core/store'

const counterStore = defineStore((set) => ({
  count: 0,
  increment: () => set((draft) => { draft.count++ }),
}))

// 任意组件中使用 — 支持直接解构
const { count, increment } = counterStore.useStore()
```

Store 在 SSR 时自动序列化，在客户端自动水合。

## Head 管理

```tsx
// app/blog/[slug]/head.tsx
import type { HeadFunction } from '@paretojs/core'

export const head: HeadFunction = ({ loaderData, params }) => ({
  title: loaderData.post.title,
  meta: [
    { name: 'description', content: loaderData.post.summary },
    { property: 'og:title', content: loaderData.post.title },
  ],
})
```

嵌套的 `head.tsx` 文件自动合并 — 子级值覆盖父级值。

## 配置

```ts
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

export default {
  appDir: 'app',        // 默认: 'app'
  outDir: '.pareto',    // 默认: '.pareto'
  configureVite: (config, { isServer }) => ({
    ...config,
    // 自定义 Vite 配置
  }),
} satisfies ParetoConfig
```

## CLI

```bash
pareto dev      # 启动开发服务器（支持 HMR）
pareto build    # 生产环境构建（客户端 + 服务端）
pareto start    # 启动生产服务器
```

## 赞助我

如果我的工作对你有帮助，考虑给我买杯咖啡吧，非常感谢！

<p float="left">
  <img src="https://d21002cb.images-f3o.pages.dev/images/wechat.jpg" alt="Wechat Pay" width="200" />
  <img src="https://d21002cb.images-f3o.pages.dev/images/ali.jpg" alt="Ali Pay" width="200" />
</p>

## License

MIT
