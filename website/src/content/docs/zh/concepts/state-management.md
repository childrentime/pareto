---
title: 状态管理
description: 基于 Immer 的内置响应式 Store，支持 SSR 序列化。
---

Pareto 内置了基于 Immer 的状态管理方案。无需额外依赖。

## defineStore

使用 `defineStore` 创建全局响应式 Store。初始化函数接收 `set`（Immer 驱动的状态更新）和 `get`（读取当前状态）：

```tsx
import { defineStore } from '@paretojs/core/store'

const counterStore = defineStore((set) => ({
  count: 0,
  history: [] as string[],
  increment: () =>
    set((draft) => {
      draft.count++
      draft.history.push(`+1 → ${draft.count}`)
    }),
  decrement: () =>
    set((draft) => {
      draft.count--
      draft.history.push(`-1 → ${draft.count}`)
    }),
  reset: () =>
    set((draft) => {
      draft.count = 0
      draft.history = []
    }),
}))
```

## 如何在组件中使用 Store？

支持直接解构：

```tsx
function Counter() {
  const { count, increment, decrement, reset } = counterStore.useStore()

  return (
    <div>
      <span>{count}</span>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  )
}
```

## Store API

使用 `defineStore` 创建的每个 Store 返回：

| 方法 | 描述 |
|------|------|
| `useStore()` | React Hook — 返回状态和 action，状态变化时重新渲染 |
| `getState()` | 在 React 外部获取当前状态 |
| `setState(fn)` | 使用 Immer draft 更新状态 |
| `subscribe(fn)` | 监听状态变化 |

## useStore() 如何处理重渲染？

`useStore()` 返回一个代理对象，每个属性的 getter 独立调用 `useSyncExternalStore`。当你解构 `const { count } = useStore()` 时，只有 `count` 被订阅 — 其他属性（如 `history`）的变化不会触发重渲染。无需手动 selector。

对于派生值，解构所需属性后直接计算：

```tsx
function useOrderTotal() {
  const { items } = orderStore.useStore()
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

该 hook 通过代理 getter 订阅 `items`。当 `items` 变化时，组件重渲染并重新计算总额。不需要 `subscribe` 或 `useSyncExternalStore` — 只需 `useStore()` 加普通 JavaScript。

## SSR 序列化是怎样工作的？

对于 Context Store，SSR 水合是自动的。框架将 loader 数据序列化到 HTML 中，客户端通过 `useLoaderData()` 读取。将数据传递给 `<Provider initialData={data}>`，store 就会用服务端数据初始化，无需额外配置：

```tsx
export function loader(ctx: LoaderContext) {
  return { products: getProducts() }
}

export default function Page() {
  const data = useLoaderData()
  return (
    <Provider initialData={data}>
      <ProductList />
    </Provider>
  )
}
```

全局 Store（`defineStore`）仅在客户端运行 — 每次渲染时使用默认状态初始化。如需从服务端数据水合全局 Store，可以使用 `@paretojs/core/node` 的 `dehydrate()` 和 `@paretojs/core/store` 的 `hydrateStores()`。

## 什么是 Context Store？

对于按请求隔离的状态（SSR 安全），使用 `defineContextStore`：

```tsx
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((initialUser) => (set) => ({
  user: initialUser,
  setUser: (user) => set((draft) => { draft.user = user }),
}))
```

用 `<Provider>` 包裹组件树，传入 `initialData`：

```tsx
function App({ user }) {
  return (
    <Provider initialData={user}>
      <Dashboard />
    </Provider>
  )
}
```
