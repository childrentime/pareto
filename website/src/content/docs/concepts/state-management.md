---
title: State Management
description: Built-in reactive stores with Immer mutations and SSR serialization.
---

Pareto includes a built-in state management solution powered by Immer. No extra dependencies needed. Stores are reactive, support direct destructuring, and serialize automatically for SSR hydration.

## defineStore

Create a global reactive store with `defineStore`. The initializer function receives a `set` function for Immer-powered mutations:

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

## Usage in components

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

## Selector pattern for performance

When a component only needs part of the state, use `getState()` with `subscribe()` to build a selector that avoids unnecessary re-renders. However, for most cases, `useStore()` with destructuring is sufficient — Pareto's store tracks which properties are accessed and only re-renders when those properties change.

```tsx
import { useSyncExternalStore } from 'react'

// Only re-renders when `count` changes, ignores `history` changes
function CountDisplay() {
  const count = useSyncExternalStore(
    counterStore.subscribe,
    () => counterStore.getState().count
  )
  return <span>{count}</span>
}
```

This manual selector approach is only necessary when you have a store with many frequently-changing properties and a component that reads only a small subset. For the vast majority of components, direct destructuring from `useStore()` is the recommended approach.

## SSR serialization

Stores are automatically serialized on the server and hydrated on the client. No manual setup needed. During SSR, the server renders the store's initial state into the HTML. On hydration, the client picks up that state so there is no flash of default values. This happens transparently — you write the same store code for both server and client.

## Context stores

For per-request state that is SSR-safe, use `defineContextStore`. Global stores created with `defineStore` share state across all requests on the server, which can cause data leaks between users. Context stores use React context to scope state to a single render tree:

```tsx
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((set) => ({
  user: null,
  setUser: (user) => set((draft) => { draft.user = user }),
}))
```

Wrap a section of your component tree with `<Provider>`:

```tsx
function App() {
  return (
    <Provider>
      <Dashboard />
    </Provider>
  )
}

function Dashboard() {
  const { user, setUser } = useStore()
  // ...
}
```

## When to use global vs. context stores

- **Global store (`defineStore`)** — Best for client-only state that does not vary per request: UI theme, sidebar open/closed, client-side caches. On the server, the initial state is the same for every request, so there is no cross-request contamination risk.
- **Context store (`defineContextStore`)** — Best for per-request state: current user, auth tokens, request-specific feature flags. Because context stores are scoped to a Provider, each SSR request gets its own isolated instance.

If you are unsure, start with `defineContextStore`. It is always SSR-safe. You can switch to a global store later if the state truly is shared and request-independent.

For the full API reference, type signatures, and hydration details, see the [Store API page](/api/store/).
