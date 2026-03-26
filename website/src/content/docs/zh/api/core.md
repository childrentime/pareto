---
title: "@paretojs/core"
description: 核心运行时导出 — 组件、Hooks 和辅助函数。
---

Pareto 运行时 API 的主入口。

```tsx
import {
  Link,
  Await,
  ParetoErrorBoundary,
  useLoaderData,
  useRouter,
  defer,
  redirect,
  notFound,
  mergeHeadDescriptors,
} from '@paretojs/core'
```

## 组件

### `<Link>`

客户端导航链接。拦截点击以实现同源导航。

```tsx
<Link href="/about">关于</Link>
<Link href="/blog" prefetch="viewport">博客</Link>
<Link href="/login" replace>登录</Link>
```

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `href` | `string` | 必填 | 目标 URL |
| `prefetch` | `'hover' \| 'viewport' \| 'none'` | `'hover'` | 预取策略 |
| `replace` | `boolean` | `false` | 替换历史记录条目 |
| `scroll` | `boolean` | `true` | 导航时滚动到顶部 |

### `<Await>`

渲染来自 `defer()` 的延迟数据。在 Promise 解析前显示 `fallback`。

```tsx
<Await resolve={data.feed} fallback={<Skeleton />}>
  {(feed) => <Feed items={feed} />}
</Await>
```

### `<ParetoErrorBoundary>`

React 错误边界，用于捕获渲染错误。包裹可能抛出错误的 UI 部分。详见[错误处理](/zh/concepts/error-handling/)。

```tsx
<ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
  <RiskyComponent />
</ParetoErrorBoundary>
```

| 属性 | 类型 | 描述 |
|------|------|------|
| `fallback` | `React.ComponentType<{ error: Error }>` | 捕获错误时渲染的组件 |
| `children` | `ReactNode` | 正常渲染的内容 |

## Hooks

### `useLoaderData<T>()`

访问路由 `loader` 函数返回的数据。

```tsx
const data = useLoaderData<{ user: User }>()
```

### `useRouter()`

访问路由状态和导航方法。

```tsx
const { pathname, params, isNavigating, push, replace, back, prefetch } = useRouter()
```

## 函数

### `defer(data)`

包裹 loader 返回值以实现流式传输。已解析的值立即发送；Promise 通过 Suspense 流式传输。

```tsx
return defer({
  instant: { count: 42 },
  streamed: fetchSlowData(),
})
```

### `redirect(url, status?)`

在 loader 中抛出以触发 HTTP 重定向。默认状态码：302。

```tsx
throw redirect('/login')
throw redirect('/new-url', 301)
```

### `notFound()`

在 loader 中抛出以渲染 `not-found.tsx`，返回 404 状态码。

```tsx
throw notFound()
```

## 类型

### `LoaderContext`

```tsx
interface LoaderContext {
  req: Request   // Express 请求对象
  res: Response  // Express 响应对象
  params: Record<string, string>
}
```

### `RouteConfig`

```tsx
interface RouteConfig {
  render?: 'server' | 'static'
}
```

### `HeadDescriptor`

```tsx
interface HeadDescriptor {
  title?: string
  meta?: Record<string, string>[]
  link?: Record<string, string>[]
}
```
