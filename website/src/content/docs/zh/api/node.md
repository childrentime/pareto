---
title: "@paretojs/core/node"
description: 服务端导出 — 请求处理器、安全头和生产服务器。
---

用于自定义 Express 服务器和生产部署的服务端 API。

```ts
import {
  createRequestHandler,
  securityHeaders,
  startProductionServer,
  SECURITY_HEADERS,
} from '@paretojs/core/node'
```

## `createRequestHandler(options)`

创建一个 Express 中间件，处理所有 Pareto 路由 — 页面渲染、loader 执行、流式传输和客户端导航数据请求。这是服务端运行时的核心。

由构建生成的服务端 bundle 内部调用，传入正确的选项（路由、manifest、模块加载器等）。你不需要直接调用它 — 使用 `app.ts` 自定义服务器模式即可（见下文）。

## `securityHeaders()`

Express 中间件，在每个响应上设置 OWASP 推荐的基线安全头：

```ts
import { securityHeaders } from '@paretojs/core/node'

app.use(securityHeaders())
```

此中间件设置的响应头：

| 响应头 | 值 | 用途 |
|--------|------|------|
| `X-Content-Type-Options` | `nosniff` | 防止 MIME 类型嗅探 |
| `X-Frame-Options` | `SAMEORIGIN` | 点击劫持防护 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 限制发送到其他域的 Referrer 信息 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | 禁用未使用的浏览器功能 |
| `X-DNS-Prefetch-Control` | `off` | 防止推测性 DNS 解析 |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | 强制 HTTPS（仅在 HTTPS 下有效） |
| `Cross-Origin-Opener-Policy` | `same-origin` | 隔离浏览上下文以缓解 Spectre |

在开发环境和使用内置生产服务器时自动应用。自定义服务器需要手动添加。

## `SECURITY_HEADERS`

原始的响应头列表，格式为 `[string, string][]` 元组，用于在 Express 中间件之外应用：

```ts
import { SECURITY_HEADERS } from '@paretojs/core/node'

// 例如在 Serverless 函数中
for (const [name, value] of SECURITY_HEADERS) {
  response.headers.set(name, value)
}
```

## `startProductionServer(outDir, appFilePath?)`

启动内置生产服务器。`pareto start` 内部使用。从 `outDir` 加载服务端 bundle，提供静态资源（带正确的缓存策略），并应用安全头。

如果提供了 `appFilePath`，会加载该文件并将默认导出作为自定义 Express 应用。这让你可以添加中间件、自定义路由或任何 Express 配置，同时仍使用 Pareto 的路由：

```ts
// app.ts（自定义服务器）
import express from 'express'
import { securityHeaders } from '@paretojs/core/node'

const app = express()
app.use(securityHeaders())
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

export default app
```

自定义应用与 Pareto 的请求处理器合并 — 你的自定义路由优先匹配，未匹配的请求会回退到 Pareto 的路由。

## 自定义服务器示例

要完全控制 Express 服务器，在项目根目录创建 `app.ts`：

```ts
// app.ts
import express from 'express'
import { securityHeaders } from '@paretojs/core/node'

const app = express()

app.use(securityHeaders())

app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', crypto.randomUUID())
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

export default app
```

运行 `pareto start`，它会自动检测并使用你的 `app.ts`。

## 相关

- [配置](/zh/api/config/) — `ParetoConfig` 和 CLI 选项。
- [资源路由](/zh/concepts/resource-routes/) — 通过 `route.ts` 创建 API 端点。
