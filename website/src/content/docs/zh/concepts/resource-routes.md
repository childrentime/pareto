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

对于认证失败，推荐返回 JSON 错误响应而不是 `redirect()`，因为 API 调用方通常是 `fetch()` 而非浏览器直接访问：

```ts
export async function loader(ctx: LoaderContext) {
  if (!ctx.req.cookies.token) {
    ctx.res.status(401)
    return { error: 'Unauthorized' }
  }
  const resource = await getResource(ctx.params.id)
  if (!resource) {
    ctx.res.status(404)
    return { error: 'Not found' }
  }
  return { resource }
}
```

## 认证示例

一种常见模式是在资源路由中检查认证后再返回数据：

```ts
// app/api/profile/route.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const token = ctx.req.cookies.token
  if (!token) {
    ctx.res.status(401)
    return { error: 'Unauthorized' }
  }

  const user = await verifyToken(token)
  if (!user) {
    ctx.res.status(403)
    return { error: 'Invalid token' }
  }

  return { user }
}
```

## 中间件模式

对于多个资源路由之间的共享逻辑（认证检查、日志、限流），在自定义服务器（`app.ts`）中添加 Express 中间件：

```ts
// app.ts
import express from 'express'
import { securityHeaders } from '@paretojs/core/node'

const app = express()
app.use(securityHeaders())

// 为所有 /api/* 路由添加认证中间件
app.use('/api', (req, res, next) => {
  const token = req.cookies.token
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
})

export default app
```

自定义路由和中间件优先匹配，未匹配的请求会自动回退到 Pareto 的路由。详见 [@paretojs/core/node](/zh/api/node/)。

## 相关

- [配置](/zh/api/config/) — `pareto.config.ts` 选项和通过 `vite.config.ts` 自定义 Vite。
- [基于文件的路由](/zh/concepts/routing/) — `route.ts` 如何融入文件路由系统。
- [重定向与 404](/zh/concepts/redirects/) — 在页面 loader 中使用 `redirect()` 和 `notFound()`。
