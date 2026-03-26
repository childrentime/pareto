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
