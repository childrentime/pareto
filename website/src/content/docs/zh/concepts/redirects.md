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

框架会捕获重定向并发送相应的 HTTP 响应。在 SSR 和客户端导航中都有效。

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

对于未匹配的 URL 和程序化的 `notFound()` 调用，都会渲染此组件，并返回 404 HTTP 状态码。
