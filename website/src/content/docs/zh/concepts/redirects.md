---
title: 重定向与 404
description: 在 loader 中使用 redirect() 和 notFound() 控制导航。
---

## 重定向

在 loader 中抛出 `redirect()` 来发送 HTTP 重定向：

```tsx
import { redirect } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    throw redirect('/login')        // 默认 302
  }
  // 或使用自定义状态码：
  throw redirect('/new-url', 301)   // 永久重定向
}
```

框架会捕获重定向并发送相应的 HTTP 响应。在 SSR 和客户端导航中都有效。在 SSR 期间，服务器会发送 HTTP 302（或 301）响应。在客户端导航期间，路由器会拦截重定向并导航到目标 URL，而无需完整的页面刷新。

## 常见重定向模式

### 身份验证守卫

将未认证的用户重定向到登录页面，同时保留原始 URL 以便登录后重定向回来：

```tsx
export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    const returnTo = encodeURIComponent(ctx.req.url)
    throw redirect(`/login?returnTo=${returnTo}`)
  }
  return { user: await getUser(ctx.req.cookies.token) }
}
```

### URL 迁移

当你重命名一个路由时，使用 301（永久）状态码从旧 URL 添加重定向到新 URL：

```tsx
// app/old-blog/page.tsx
export function loader() {
  throw redirect('/blog', 301)
}

export default function OldBlog() {
  return null // 永远不会渲染
}
```

搜索引擎在收到 301 重定向时会将其索引更新为新 URL。

### 操作后重定向

在表单提交或数据变更后，重定向到成功页面：

```tsx
export async function action(ctx: LoaderContext) {
  await createPost(ctx.req.body)
  throw redirect('/posts?created=true')
}
```

## 404 未找到

在 loader 中抛出 `notFound()` 来渲染 `not-found.tsx` 页面：

```tsx
import { notFound } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  const post = await getPost(ctx.params.slug)
  if (!post) throw notFound()
  return { post }
}
```

## not-found.tsx

在应用根目录放置一个 `not-found.tsx`：

```tsx
// app/not-found.tsx
import { Link } from '@paretojs/core'

export default function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <p>找不到该页面。</p>
      <Link href="/">返回首页</Link>
    </div>
  )
}
```

对于未匹配的 URL 和程序化的 `notFound()` 调用，都会渲染此组件，并返回 404 HTTP 状态码。`not-found.tsx` 组件被根级 `layout.tsx` 包裹，因此站点范围的导航在 404 页面上仍然可访问。

## 重定向状态码

| 状态码 | 含义 | 何时使用 |
|--------|------|----------|
| `301` | 永久移动 | URL 已永久更改 — 搜索引擎会更新其索引 |
| `302` | 已找到（默认） | 临时重定向 — 原始 URL 仍然是规范的 |
| `307` | 临时重定向 | 与 302 相同，但保留 HTTP 方法（POST 保持为 POST） |
| `308` | 永久重定向 | 与 301 相同，但保留 HTTP 方法 |

在大多数情况下，默认的 302 是正确的。仅当旧 URL 永远不会再提供内容时才使用 301。
