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
  useRouterSnapshot,
  useStreamData,
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

| 属性 | 类型 | 描述 |
|------|------|------|
| `pathname` | `string` | 当前 URL 路径 |
| `params` | `Record<string, string>` | 动态路由参数 |
| `isNavigating` | `boolean` | 导航过渡中为 `true` |
| `push(url, opts?)` | `(url: string, opts?: NavigateOptions) => void` | 导航到 URL（添加历史记录） |
| `replace(url, opts?)` | `(url: string, opts?: NavigateOptions) => void` | 导航到 URL（替换历史记录） |
| `back()` | `() => void` | 返回上一页 |
| `prefetch(url)` | `(url: string) => void` | 预取路由的 loader 数据 |

`NavigateOptions` 接受 `{ replace?: boolean, scroll?: boolean }`。例如 `push('/page', { scroll: false })` 导航时不滚动到顶部。

### `useRouterSnapshot()`

只读路由状态，不含导航方法。比 `useRouter()` 更轻量 — 只需读取当前路由信息时使用。

```tsx
const { pathname, params, isNavigating } = useRouterSnapshot()
```

返回 `RouterState` 对象，包含 `pathname`、`params` 和 `isNavigating`。

### `useStreamData<T>(promiseOrValue)`

不使用 `<Await>` 消费延迟值的 Hook。会挂起组件直到 Promise 解析，因此必须在 `<Suspense>` 边界内使用。

```tsx
function Activity({ data }: { data: Promise<Items> | Items }) {
  const items = useStreamData(data)
  return <div>{items.length} items</div>
}
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
