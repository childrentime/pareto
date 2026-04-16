---
title: "Pareto 动态路由实战：[slug]、catch-all、嵌套布局"
description: Pareto 文件路由完整实战——动态段、catch-all、路由组、嵌套布局。顺带搭建一个文档站和多租户仪表板。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 4 月 16 日</p>

文件路由这东西，看起来简单，真动手写复杂应用时才知道坑在哪。动态 blog slug、多层级文档路径、共享侧边栏的租户仪表板、共享布局但不共享 URL 前缀的营销页——每一个真实项目都要用到，每一个框架处理方式都不完全一样。

本文把 Pareto 支持的所有路由模式走一遍，代码你可以直接复制到 `app/` 里。

## 心智模型

在 Pareto 里，文件系统**就是**路由器。`app/` 下每一个包含 `page.tsx` 的目录就是一个 URL。没有独立的路由配置，没有 `routes.ts` 注册表，没有代码生成步骤。你移动一个文件——URL 就变了。你重命名一个目录——URL 也变了。

约定文件全集：

| 文件 | 作用 |
|------|------|
| `page.tsx` | 渲染页面 |
| `layout.tsx` | 包裹子页面 |
| `loader.ts` | 服务端数据获取 |
| `head.tsx` | `<title>`、meta 标签 |
| `not-found.tsx` | 404 页（仅根目录） |
| `error.tsx` | 错误页（仅根目录） |
| `document.tsx` | `<html>` 定制（仅根目录） |
| `route.ts` | JSON API 端点 |

其他放在文件夹里的文件，Pareto 一概忽略——就是你自己的组件、工具或样式。

## 静态路由

最简单的情形：

```
app/
  page.tsx              → /
  about/
    page.tsx            → /about
  pricing/
    page.tsx            → /pricing
  blog/
    page.tsx            → /blog
```

目录名一一映射为 URL 段。大小写敏感——`app/About/page.tsx` 生成 `/About` 而不是 `/about`。统一用小写。

## 动态段：[param]

真实应用几乎都有带动态参数的页面——blog slug、商品 ID、用户名。把这段名字放进方括号：

```
app/blog/[slug]/page.tsx  → /blog/:slug
```

这个路由匹配 `/blog/hello-world`、`/blog/pareto-4`、`/blog/anything-at-all`。通过 `ctx.params` 访问值：

```ts
// app/blog/[slug]/loader.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const { slug } = ctx.params
  const post = await db.post.findUnique({ where: { slug } })

  if (!post) {
    throw new Response('Not found', { status: 404 })
  }

  return { post }
}
```

括号里的名字就是 `ctx.params` 上的键名。叫 `[slug]`，取 `params.slug`。叫 `[id]`，取 `params.id`。没有隐式映射。

多个动态段可以组合：

```
app/users/[userId]/posts/[postId]/page.tsx  → /users/:userId/posts/:postId
```

两个参数都会出现在 `ctx.params` 里：

```ts
const { userId, postId } = ctx.params
```

## Catch-all 路由：[...param]

有时你不知道路径会有多深。文档站可能有 `/docs/getting-started`、`/docs/api/core/loader`、`/docs/guides/deployment/docker/rootless`。给每一层都写一个文件夹不现实。用 catch-all：

```
app/docs/[...path]/page.tsx  → /docs/*
```

`ctx.params.path` 里是 `/docs/` 之后的全部内容，斜杠保留：

```ts
// /docs/getting-started       → path = "getting-started"
// /docs/api/core/loader       → path = "api/core/loader"
// /docs/guides/deploy/docker  → path = "guides/deploy/docker"
```

你想怎么拆都行：

```tsx
// app/docs/[...path]/page.tsx
import { useLoaderData } from '@paretojs/core'

export default function DocsPage() {
  const { doc } = useLoaderData<{ doc: { title: string; html: string } }>()
  return (
    <article>
      <h1>{doc.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  )
}
```

```ts
// app/docs/[...path]/loader.ts
export async function loader(ctx: LoaderContext) {
  const slug = ctx.params.path  // "api/core/loader"
  const doc = await loadMarkdown(`content/docs/${slug}.md`)
  return { doc }
}
```

### 可选 catch-all：[[...param]]

`[...path]` 有个坑：它**不**匹配父路径。`/docs/[...path]/page.tsx` 匹配 `/docs/anything` 但不匹配 `/docs` 本身——访问 `/docs` 会 404。

如果你想父路径和子路径都用同一个组件，用双括号的可选 catch-all：

```
app/docs/[[...path]]/page.tsx  → /docs 和 /docs/*
```

在根路径下，`ctx.params.path` 是 `undefined`。需要判断：

```ts
export async function loader(ctx: LoaderContext) {
  const slug = ctx.params.path ?? 'index'
  const doc = await loadMarkdown(`content/docs/${slug}.md`)
  return { doc }
}
```

现在 `/docs` 加载 `content/docs/index.md`，`/docs/api/core` 加载 `content/docs/api/core.md`。一个路由文件覆盖整棵文档树。

## 嵌套布局

布局是你不用在每个页面里重复 header 和 footer 的原因。`layout.tsx` 会包裹所在目录及子目录下的所有页面：

```
app/
  layout.tsx            ← 包裹一切
  page.tsx              ← /
  dashboard/
    layout.tsx          ← 包裹 dashboard 页面
    page.tsx            ← /dashboard
    settings/
      page.tsx          ← /dashboard/settings
    billing/
      page.tsx          ← /dashboard/billing
```

`/dashboard/settings` 的渲染树：

```
<RootLayout>
  <DashboardLayout>
    <SettingsPage />
  </DashboardLayout>
</RootLayout>
```

布局通过 prop 接收子组件：

```tsx
// app/dashboard/layout.tsx
import type { PropsWithChildren } from 'react'
import { Link } from '@paretojs/core'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <div className="dashboard-shell">
      <aside>
        <Link to="/dashboard">概览</Link>
        <Link to="/dashboard/settings">设置</Link>
        <Link to="/dashboard/billing">账单</Link>
      </aside>
      <main>{children}</main>
    </div>
  )
}
```

在 `/dashboard`、`/dashboard/settings`、`/dashboard/billing` 之间导航——侧边栏永远不会卸载。只有 `<main>` 里的内容变。这就是嵌套布局的价值：相关路由共享稳定的 UI 外壳，不用靠 Redux-管侧边栏 这种黑魔法。

## 路由组：共享布局但不加 URL 段

很多时候你想让**不**共享 URL 前缀的路由共享布局。营销页（`/`、`/about`、`/pricing`）要一个布局，认证页（`/login`、`/signup`）要另一个，两者都不希望布局名出现在 URL 里。

把目录用括号包起来，变成路由组——影响布局嵌套，但不出现在 URL 中：

```
app/
  (marketing)/
    layout.tsx          ← 营销页共享布局
    page.tsx            → /
    about/
      page.tsx          → /about
    pricing/
      page.tsx          → /pricing
  (auth)/
    layout.tsx          ← 认证页共享布局（居中卡片，无导航）
    login/
      page.tsx          → /login
    signup/
      page.tsx          → /signup
```

没有任何 URL 包含 `marketing` 或 `auth` 字样。括号在构建时消失——纯粹是文件树的分组机制。

## 真实示例：多租户 SaaS

把所有东西合起来。你在做一个 SaaS，每个租户有独立仪表板（`/t/:tenantSlug`），加上文档站、公开营销页、认证页。完整目录树：

```
app/
  layout.tsx                        ← 根布局（主题、字体）

  (marketing)/
    layout.tsx                      ← 营销外壳
    page.tsx                        → /
    pricing/
      page.tsx                      → /pricing
    about/
      page.tsx                      → /about

  (auth)/
    layout.tsx                      ← 居中认证卡片
    login/
      page.tsx                      → /login
    signup/
      page.tsx                      → /signup

  t/
    [tenantSlug]/
      layout.tsx                    ← 租户外壳（侧边栏、切换器）
      loader.ts                     ← 加载租户，不存在就 404
      page.tsx                      → /t/:tenantSlug（概览）
      settings/
        page.tsx                    → /t/:tenantSlug/settings
      projects/
        [projectId]/
          layout.tsx                ← 项目外壳
          page.tsx                  → /t/:tenantSlug/projects/:projectId

  docs/
    [[...path]]/
      page.tsx                      → /docs 和 /docs/*
      loader.ts

  api/
    health/
      route.ts                      → /api/health（JSON）
```

本文提到的每一个模式都在这：

- 路由组 `(marketing)` 和 `(auth)` 实现无 URL 前缀的布局共享
- 动态参数 `[tenantSlug]`、`[projectId]`
- 文档站的可选 catch-all `[[...path]]`
- 根层、租户层、项目层的嵌套布局
- `route.ts` 提供 JSON 健康检查端点

根 `layout.tsx` 管主题、字体、全局 provider。租户 layout 跑一个 loader 去拉租户记录，slug 不合法就抛 404——里面每个页面自动继承这个检查。项目 layout 加项目级导航。`/t/:tenantSlug/*` 里的每个页面都不需要重新拉租户、不需要重新渲染侧边栏。

## Loader 优先级：page.tsx vs loader.ts

你可以从 `page.tsx` 导出 `loader`：

```tsx
// app/blog/[slug]/page.tsx
export function loader(ctx: LoaderContext) {
  return { post: getPost(ctx.params.slug) }
}

export default function BlogPost() { /* ... */ }
```

或者放在独立文件里：

```ts
// app/blog/[slug]/loader.ts
export function loader(ctx: LoaderContext) {
  return { post: getPost(ctx.params.slug) }
}
```

**两个都存在时，`loader.ts` 胜出。** 当 loader 有大量服务端依赖时（数据库驱动、文件系统调用、secret 环境变量），用独立文件——避免这些代码意外被客户端路径引入。

小 loader 直接写在 `page.tsx` 里没问题。一涉及 DB client，就拆到 `loader.ts`。

## 路由匹配：具体优先，不看文件顺序

当一个 URL 能匹配多个路由时，Pareto 选最具体的那个。规则：

1. 静态段优先于动态段
2. 动态段优先于 catch-all
3. 必需 catch-all 优先于可选 catch-all

所以对 `/blog/featured`：

- `app/blog/featured/page.tsx` —— 静态，胜出
- `app/blog/[slug]/page.tsx` —— 动态，输给静态
- `app/blog/[...rest]/page.tsx` —— catch-all，输给动态

这意味着你可以在动态路由旁边自由添加具体路由。给 `/blog/featured` 做一个特殊静态页，其他所有 slug 落到 `/blog/[slug]` 里。不用在动态组件里写条件判断，也不用配匹配优先级。

## 路由里没有的东西

Pareto 的路由有意做得比 Next.js 小。它没有：

- **没有并行路由。** 每个布局一个插槽。需要两个独立路由的面板？用 React 状态或多个 `<iframe>` 边界自己组合。
- **没有拦截路由。** 想带 URL 的 modal 就是带 URL 状态的 modal——用 query 参数或者 `[modal]` 动态段。
- **没有 middleware 文件约定。** 认证检查放在 layout loader 里（每个嵌套页面都会跑），或者放到 Hono app 配置里。
- **没有 `private` 文件夹约定。** 非路由文件想叫什么叫什么。没有 `page.tsx` 就不是路由。

好处：几乎没东西要记。整个路由系统一页文档加一篇博文就讲完了。

## 试一试

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

从一个 `page.tsx` 开始。需要时加一个 `[slug]`。布局分化了就上路由组。不管你的应用长成什么形状，路由都跟得上。

相关阅读：
- [路由文档](/zh/concepts/routing/) —— 每个约定文件的完整参考
- [流式 SSR](/zh/blog/streaming-ssr/) —— `defer()` 和 `<Await>` 在任何路由里都能用
- [Head 管理](/zh/concepts/head-management/) —— 每路由的 title 和 meta

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
