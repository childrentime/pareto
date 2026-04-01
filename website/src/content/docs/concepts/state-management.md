---
title: State Management
description: Built-in reactive stores with Immer mutations and per-property subscriptions.
---

Pareto includes a built-in state management solution powered by Immer. No extra dependencies needed. Stores are reactive and support direct destructuring with per-property subscriptions.

## defineStore

Create a global reactive store with `defineStore`. The initializer function receives a `set` function for Immer-powered mutations and a `get` function for reading current state:

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

## How do I use stores in components?

Supports direct destructuring — pull out exactly the state and actions you need:

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

Each store created with `defineStore` returns an object with these methods. See the full [Store API reference](/api/store/) for type signatures and detailed usage.

| Method | Description |
|--------|-------------|
| `useStore()` | React hook — returns state + actions, re-renders on change |
| `getState()` | Get current state outside React |
| `setState(fn)` | Update state with Immer draft |
| `subscribe(fn)` | Listen for state changes |

## How does useStore() handle re-renders?

`useStore()` returns a proxy object where each property getter independently calls `useSyncExternalStore`. When you destructure `const { count } = useStore()`, only `count` is subscribed — changes to other properties like `history` do not cause a re-render. No manual selectors needed.

For derived values, destructure what you need and compute from it:

```tsx
function useOrderTotal() {
  const { items } = orderStore.useStore()
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

The hook subscribes to `items` via the proxy getter. When `items` changes, the component re-renders and the total is recomputed. No need for `subscribe` or `useSyncExternalStore` — just `useStore()` and plain JavaScript.

## What are context stores?

For per-request state that is SSR-safe, use `defineContextStore`. Global stores created with `defineStore` share state across all requests on the server, which can cause data leaks between users. Context stores use React context to scope state to a single render tree:

```tsx
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((initialUser) => (set) => ({
  user: initialUser,
  setUser: (user) => set((draft) => { draft.user = user }),
}))
```

Wrap a section of your component tree with `<Provider>`, passing `initialData`:

```tsx
function App({ user }) {
  return (
    <Provider initialData={user}>
      <Dashboard />
    </Provider>
  )
}

function Dashboard() {
  const { user, setUser } = useStore()
  // ...
}
```

## When should I use global vs. context stores?

- **Global store (`defineStore`)** — Best for client-only state that does not vary per request: UI theme, sidebar open/closed, client-side caches. On the server, the initial state is the same for every request, so there is no cross-request contamination risk.
- **Context store (`defineContextStore`)** — Best for per-request state: current user, auth tokens, request-specific feature flags. Because context stores are scoped to a Provider, each SSR request gets its own isolated instance.

If you are unsure, start with `defineContextStore`. It is always SSR-safe. You can switch to a global store later if the state truly is shared and request-independent.

For the full API reference, type signatures, and hydration details, see the [Store API page](/api/store/).
