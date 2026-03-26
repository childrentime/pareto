---
title: Head 管理
description: 通过 head.tsx 为每个路由设置标题和 meta 标签，支持自动合并。
---

每个路由可以从 `head.tsx` 导出 `head()` 函数来设置 `<title>` 和 meta 标签。

## head.tsx

```tsx
// app/head.tsx（根级 — 应用于所有页面）
import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'My App',
    meta: [
      { name: 'description', content: 'My awesome app.' },
    ],
  }
}
```

```tsx
// app/blog/head.tsx（覆盖 /blog 的标题）
export function head(): HeadDescriptor {
  return {
    title: 'Blog — My App',
    meta: [
      { name: 'description', content: 'Read our latest posts.' },
    ],
  }
}
```

## HeadDescriptor

```tsx
interface HeadDescriptor {
  title?: string
  meta?: Record<string, string>[]
  link?: Record<string, string>[]
}
```

## 合并行为

Head 描述符从根到页面进行合并：
- **title**：最后一个生效（最深层路由覆盖）
- **meta**：按 `name` 或 `property` 去重（最深层生效）
- **link**：按 `rel` + `href` 去重

## 客户端导航

在页面之间导航时，标题和 meta 标签会自动更新 — 无需全页面刷新。
