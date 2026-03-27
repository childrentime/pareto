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

## OG 和 Twitter Card meta 标签

使用 `property` 键定义 Open Graph 标签，使用 `name` 键定义 Twitter Card：

```tsx
export function head(): HeadDescriptor {
  return {
    title: 'My Blog Post — My App',
    meta: [
      { name: 'description', content: 'A deep dive into streaming SSR.' },
      // Open Graph
      { property: 'og:title', content: 'My Blog Post' },
      { property: 'og:description', content: 'A deep dive into streaming SSR.' },
      { property: 'og:image', content: 'https://example.com/og-image.png' },
      { property: 'og:type', content: 'article' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'My Blog Post' },
      { name: 'twitter:description', content: 'A deep dive into streaming SSR.' },
      { name: 'twitter:image', content: 'https://example.com/og-image.png' },
    ],
  }
}
```

由于 meta 标签按 `name` 或 `property` 去重，更深层路由的 OG 标签会自动替换父级设置的标签。这使得在根级 `head.tsx` 中定义站点范围的默认 OG 图片，并在特定页面上覆盖它们变得非常简单。

## 基于 loader 数据的动态 head

`head()` 函数会接收其路由的 loader 数据，因此你可以根据服务端获取的内容设置标题和 meta 标签：

```tsx
// app/blog/[slug]/head.tsx
import type { HeadDescriptor } from '@paretojs/core'

export function head({ loaderData, params }: { loaderData: { post: { title: string; excerpt: string } }; params: Record<string, string> }): HeadDescriptor {
  return {
    title: `${loaderData.post.title} — My App`,
    meta: [
      { name: 'description', content: loaderData.post.excerpt },
      { property: 'og:title', content: loaderData.post.title },
      { property: 'og:description', content: loaderData.post.excerpt },
    ],
  }
}
```

这种模式对于博客文章、产品页面或用户个人资料等动态页面至关重要，因为这些页面的 meta 标签取决于所展示的数据。

## 客户端导航

在页面之间导航时，标题和 meta 标签会自动更新 — 无需全页面刷新。Pareto 会对比即将离开和即将进入的 head 描述符，并相应地更新 DOM。
