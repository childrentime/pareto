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

## 选项

### `configureServer`

自定义 Express 服务器（添加中间件等）：

```tsx
const config: ParetoConfig = {
  configureServer(app) {
    app.use(compression())
    app.use(cors())
  },
}
```

### `configureVite`

扩展 Vite 配置：

```tsx
const config: ParetoConfig = {
  configureVite(config, { isServer }) {
    config.plugins.push(myPlugin())
    return config
  },
}
```

## CLI 命令

```bash
pareto dev          # 启动带有 HMR 的开发服务器
pareto build        # 构建生产版本
pareto start        # 启动生产服务器
```

### 开发选项

```bash
pareto dev --port 8080    # 自定义端口
pareto dev --host 0.0.0.0 # 暴露到网络
```
