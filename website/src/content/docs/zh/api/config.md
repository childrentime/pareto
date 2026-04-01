---
title: 配置
description: pareto.config.ts — 自定义你的 Pareto 应用。
---

在项目根目录创建 `pareto.config.ts` 来自定义 Pareto 的行为。

```tsx
// pareto.config.ts
import type { ParetoConfig } from '@paretojs/core'

const config: ParetoConfig = {
  // 选项
}

export default config
```

## ParetoConfig 类型

```tsx
interface ParetoConfig {
  appDir?: string
  outDir?: string
  configureVite?: (config: UserConfig, context: { isServer: boolean }) => UserConfig
  wkWebViewFlushHint?: boolean
}
```

## 选项

### `appDir`

包含路由文件的目录。默认为 `app`。

### `outDir`

生产构建的输出目录。默认为 `.pareto`。

### `wkWebViewFlushHint`

在 HTML 骨架中注入一个包含 200+ 零宽字符的隐藏元素，强制 iOS WKWebView 在流完成前开始渲染。WebKit 在可见文本超过 200 个字符之前会延迟首次绘制，这可能导致在原生 iOS 应用中加载文本较少的页面时出现白屏闪烁。无视觉效果，屏幕阅读器会忽略。仅影响 WKWebView — Safari 和 Chrome 浏览器不受影响。默认为 `false`。

### `configureVite`

扩展 Vite 配置。该函数接收当前 Vite 配置和一个 `env` 对象，指示构建目标是服务端还是客户端。返回修改后的配置：

```tsx
const config: ParetoConfig = {
  configureVite(config, { isServer }) {
    config.plugins.push(myPlugin())

    if (isServer) {
      config.ssr = {
        ...config.ssr,
        external: ['heavy-library'],
      }
    }

    return config
  },
}
```

`configureVite` 的使用场景：

- 添加 Vite 插件（Tailwind、SVG 导入等）
- 自定义构建输出目录
- 配置 SSR externals（仅 Node.js 的包）
- 添加路径别名（`resolve.alias`）
- 修改开发服务器代理设置

## 环境变量

Pareto 使用 Vite 内置的环境变量处理。以 `VITE_` 为前缀的变量会暴露给客户端代码：

```bash
# .env
VITE_API_URL=https://api.example.com    # 客户端和服务端均可用
DATABASE_URL=postgres://localhost/mydb   # 仅服务端
```

在代码中访问：

```tsx
// 客户端和服务端
const apiUrl = import.meta.env.VITE_API_URL

// 仅服务端（loader、资源路由）
const dbUrl = process.env.DATABASE_URL
```

Vite 支持 `.env`、`.env.local`、`.env.development` 和 `.env.production` 文件。详见 [Vite 环境变量文档](https://vite.dev/guide/env-and-mode)。

## CLI 命令

```bash
pareto dev          # 启动带有 HMR 的开发服务器
pareto build        # 构建生产版本
pareto start        # 启动生产服务器
```

### 开发选项

```bash
pareto dev --port 8080    # 自定义端口（默认：3000）
pareto dev --host 0.0.0.0 # 暴露到网络
```

### 构建选项

```bash
pareto build              # 构建生产版本
```

### 生产选项

```bash
pareto start              # 启动生产服务器（默认端口：3000）
pareto start --port 8080  # 自定义端口
```

## 端口配置

默认端口为 `3000`。可通过以下方式更改（按优先级从高到低）：

1. **CLI 参数**：`pareto dev --port 8080`
2. **环境变量**：`PORT=8080 pareto dev`
3. **默认值**：`3000`

## 生产部署

生产部署时，先构建再启动：

```bash
npm run build    # 执行 pareto build
npm run start    # 执行 pareto start
```

构建输出（位于配置的 `outDir` 中，默认 `.pareto`）：
- `.pareto/client/` — 静态资源（JS、CSS、图片），可部署到 CDN
- `.pareto/server/` — 服务端包，用于 Node.js 运行时

最小化生产 `Dockerfile`：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY .pareto/ .pareto/
EXPOSE 3000
CMD ["npx", "pareto", "start"]
```

## 相关

- [资源路由](/zh/concepts/resource-routes/) — 通过 `route.ts` 创建 API 端点。
- [@paretojs/core API](/zh/api/core/) — `ParetoConfig` 类型和运行时导出。
