---
title: Head 管理
description: 通过 head.tsx React 组件为每个路由设置标题、meta 标签和脚本，支持完整的 JSX。
---

每个路由可以从 `head.tsx` 导出一个默认 React 组件来设置 `<title>`、meta 标签、脚本和其他 head 元素。Head 组件在路由树的每一层定义，从根到页面依次渲染，因此你只需设置一次全站默认值，按路由按需覆盖。

## head.tsx

Head 文件导出一个返回 JSX 的默认 React 组件。React 19 会自动将 `<title>`、`<meta>` 和 `<link>` 标签提升到文档的 `<head>` 中。

```tsx
// app/head.tsx（根级 — 应用于所有页面）
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="My awesome app." />
    </>
  )
}
```

```tsx
// app/blog/head.tsx（覆盖 /blog 的标题）
export default function Head() {
  return (
    <>
      <title>Blog — My App</title>
      <meta name="description" content="Read our latest posts." />
    </>
  )
}
```

## HeadProps

Head 组件接收 loader 数据和路由参数作为 props：

```tsx
import type { HeadProps } from '@paretojs/core'

interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

## 渲染行为

Head 组件从根到页面依次渲染。当多个组件渲染相同标签时，浏览器使用最后一个 — 因此最深层路由的 `<title>` 自动生效。

这意味着你的根 `head.tsx` 可以定义默认值（全站 meta、脚本），各路由只需覆盖所需部分。

## 内联脚本

你可以在 head.tsx 中直接包含内联脚本。这对于必须在绘制前执行的操作（如深色模式初始化）非常有用：

```tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
                document.documentElement.classList.add('dark')
            } catch(e) {}
          })()`,
        }}
      />
    </>
  )
}
```

注意：内联脚本在 SSR 期间渲染到 `<head>` 中，但在客户端导航时**不会**被 React 19 提升。对于只需在页面加载时执行一次的初始化脚本来说，这没有问题。

## OG 和 Twitter Card meta 标签

使用 `property` 属性定义 Open Graph 标签，使用 `name` 属性定义 Twitter Card：

```tsx
export default function Head() {
  return (
    <>
      <title>My Blog Post — My App</title>
      <meta name="description" content="A deep dive into streaming SSR." />
      {/* Open Graph */}
      <meta property="og:title" content="My Blog Post" />
      <meta property="og:description" content="A deep dive into streaming SSR." />
      <meta property="og:image" content="https://example.com/og-image.png" />
      <meta property="og:type" content="article" />
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="My Blog Post" />
      <meta name="twitter:description" content="A deep dive into streaming SSR." />
      <meta name="twitter:image" content="https://example.com/og-image.png" />
    </>
  )
}
```

## 基于 loader 数据的动态 head

Head 组件接收其路由的 loader 数据，因此你可以根据服务端获取的内容设置标题和 meta 标签：

```tsx
// app/blog/[slug]/head.tsx
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData, params }: HeadProps) {
  const post = (loaderData as { post: { title: string; excerpt: string } }).post
  return (
    <>
      <title>{`${post.title} — My App`}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
    </>
  )
}
```

这种模式对于博客文章、产品页面或用户个人资料等动态页面至关重要，因为这些页面的 meta 标签取决于所展示的数据。

## 添加外部资源

使用 `<link>` 标签添加样式表、favicon 或预加载提示：

```tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <link rel="icon" href="/favicon.ico" />
      <link rel="canonical" href="https://example.com/" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
    </>
  )
}
```

## 客户端导航

客户端导航时，Head 组件被懒加载并渲染到组件树中。React 19 会自动将 `<title>`、`<meta>` 和 `<link>` 标签提升到文档的 `<head>` 中 — 无需手动操作 DOM。

## 相关

- [基于文件的路由](/zh/concepts/routing/) — `head.tsx` 文件在路由树中的位置。
- [@paretojs/core API](/zh/api/core/) — `HeadProps` 和 `HeadComponent` 类型参考。
