---
title: "@paretojs/core/store"
description: 状态管理 API — defineStore、defineContextStore 和水合辅助函数。
---

基于 Immer 的内置状态管理。

```tsx
import { defineStore, defineContextStore } from '@paretojs/core/store'
```

## `defineStore(initializer)`

创建全局响应式 Store。支持直接解构。

```tsx
const counterStore = defineStore((set) => ({
  count: 0,
  increment: () => set((draft) => { draft.count++ }),
}))

// 使用
const { count, increment } = counterStore.useStore()
```

### 返回值

| 属性 | 类型 | 描述 |
|------|------|------|
| `useStore()` | `() => State` | React Hook — 状态变化时重新渲染 |
| `getState()` | `() => State` | 在 React 外部获取当前状态 |
| `setState(fn)` | `(fn: (draft) => void) => void` | 使用 Immer draft 更新状态 |
| `subscribe(fn)` | `(fn: () => void) => () => void` | 监听变化，返回取消订阅函数 |

## `defineContextStore(initializer)`

创建基于 React Context 的实例级 Store。SSR 安全（请求之间不共享全局状态）。

```tsx
const { Provider, useStore } = defineContextStore((set) => ({
  theme: 'light',
  toggle: () => set((d) => { d.theme = d.theme === 'light' ? 'dark' : 'light' }),
}))

// 用 Provider 包裹
<Provider>
  <App />
</Provider>

// 在子组件中使用
const { theme, toggle } = useStore()
```

## Immer 变更

`set` 函数接收一个 Immer draft — 你可以直接修改它：

```tsx
set((draft) => {
  draft.items.push(newItem)      // 向数组添加元素
  draft.count++                  // 递增
  delete draft.temp              // 删除属性
  draft.nested.value = 'new'    // 深层修改
})
```
