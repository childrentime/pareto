---
title: "@paretojs/core/store"
description: 状态管理 API — defineStore 和 defineContextStore。
---

基于 Immer 的内置状态管理。详见[状态管理](/zh/concepts/state-management/)了解概念、全局 Store 与 Context Store 的选择指导和性能建议。

```tsx
import { defineStore, defineContextStore } from '@paretojs/core/store'
```

## `defineStore(initializer)`

创建全局响应式 Store。支持直接解构。初始化函数接收 `set`（Immer 驱动的状态更新）和 `get`（读取当前状态）：

```tsx
const counterStore = defineStore((set, get) => ({
  count: 0,
  increment: () => set((draft) => { draft.count++ }),
  double: () => set((draft) => { draft.count = get().count * 2 }),
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
| `subscribe(fn)` | `(fn: (state, prevState) => void) => () => void` | 监听变化，返回取消订阅函数 |

## `defineContextStore(initializer)`

创建基于 React Context 的实例级 Store。SSR 安全（请求之间不共享全局状态）。当 Store 持有按请求的数据（如当前用户或认证令牌）时使用。详见[状态管理 — 何时使用全局 Store 与 Context Store](/zh/concepts/state-management/)。

```tsx
const { Provider, useStore } = defineContextStore((initial: { theme: string }) => (set) => ({
  theme: initial.theme,
  toggle: () => set((d) => { d.theme = d.theme === 'light' ? 'dark' : 'light' }),
}))

// 用 Provider 包裹，传入 initialData
<Provider initialData={{ theme: 'light' }}>
  <App />
</Provider>

// 在子组件中使用
const { theme, toggle } = useStore()
```

### 返回值

| 属性 | 类型 | 描述 |
|------|------|------|
| `Provider` | `React.FC<{ children: ReactNode; initialData: Init }>` | Context Provider — 包裹组件树 |
| `useStore()` | `() => State` | React Hook — 从最近的 Provider 读取状态 |

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

Immer 在底层确保不可变性。每次 `set()` 调用都会产生一个新的状态对象，从而触发使用该 Store 的组件重新渲染。你不需要手动展开或克隆状态。

## SSR 水合

使用 `defineContextStore` 从服务端数据水合 Store。将 loader 数据传递给 `<Provider initialData={data}>`：

```tsx
const { Provider, useStore } = defineContextStore((data) => (set) => ({
  count: data.count,
  increment: () => set((d) => { d.count++ }),
}))

export function loader() {
  return { count: 10 }
}

export default function Page() {
  const data = useLoaderData()
  return (
    <Provider initialData={data}>
      <Counter />
    </Provider>
  )
}
```

完整示例参见 [`examples/app/ssr-store/page.tsx`](https://github.com/childrentime/pareto/blob/main/examples/app/ssr-store/page.tsx)。
