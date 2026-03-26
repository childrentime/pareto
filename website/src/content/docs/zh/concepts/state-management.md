---
title: 状态管理
description: 基于 Immer 的内置响应式 Store，支持 SSR 序列化。
---

Pareto 内置了基于 Immer 的状态管理方案。无需额外依赖。

## defineStore

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

## 在组件中使用

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

## SSR 序列化

Store 在服务端自动序列化，并在客户端自动水合。无需手动配置。

## Context Store

对于按请求隔离的状态（SSR 安全），使用 `defineContextStore`：

```tsx
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((set) => ({
  user: null,
  setUser: (user) => set((draft) => { draft.user = user }),
}))
```
