---
title: 资源路由
description: 通过 route.ts 创建 API 端点 — 无组件，只有 loader/action。
---

一个包含 `route.ts` 但没有 `page.tsx` 的目录会成为资源路由 — 它直接返回 JSON，不进行 HTML 渲染。

## 用法

```ts
// app/api/time/route.ts
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return {
    timestamp: new Date().toISOString(),
    message: 'This is a resource route — no HTML, just JSON.',
  }
}
```

`GET /api/time` 返回：

```json
{
  "timestamp": "2026-03-26T12:00:00.000Z",
  "message": "This is a resource route — no HTML, just JSON."
}
```

## HTTP 方法

- **GET** → 调用 `loader` 导出
- **POST / PUT / PATCH / DELETE** → 调用 `action` 导出

```ts
// app/api/users/route.ts
export function loader(ctx: LoaderContext) {
  return { users: getAllUsers() }
}

export async function action(ctx: LoaderContext) {
  const body = ctx.req.body
  const user = await createUser(body)
  return { user }
}
```

## 响应头和状态码

`ctx.res` 对象是标准的 Express 响应。在返回数据之前设置自定义头和状态码：

```ts
export function loader(ctx: LoaderContext) {
  ctx.res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
  ctx.res.setHeader('X-Custom-Header', 'my-value')
  return { data: getCachedData() }
}

export async function action(ctx: LoaderContext) {
  const item = await createItem(ctx.req.body)
  ctx.res.status(201)
  return { item }
}
```

## 资源路由中的错误处理

在资源路由中抛出错误的方式与在页面 loader 中相同。Pareto 会捕获错误并返回 JSON 错误响应：

```ts
export async function loader(ctx: LoaderContext) {
  const user = await getUser(ctx.params.id)
  if (!user) {
    ctx.res.status(404)
    return { error: 'User not found' }
  }
  return { user }
}
```

对于结构化的错误响应，你可以显式设置状态码。与页面路由不同，资源路由不会渲染错误边界 — 它们向调用方返回 JSON。

你也可以在资源路由中使用 [`redirect()`](/zh/concepts/redirects/) 和 `notFound()`：

```ts
import { redirect, notFound } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    throw redirect('/login')
  }
  const resource = await getResource(ctx.params.id)
  if (!resource) throw notFound()
  return { resource }
}
```
