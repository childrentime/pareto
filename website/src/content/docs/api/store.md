---
title: "@paretojs/core/store"
description: State management API — defineStore, defineContextStore, and hydration helpers.
---

Built-in state management powered by Immer. See [State Management](/concepts/state-management/) for concepts, guidance on when to use global vs. context stores, and performance tips.

```tsx
import { defineStore, defineContextStore } from '@paretojs/core/store'
```

## `defineStore(initializer)`

Create a global reactive store. Supports direct destructuring. The initializer receives `set` for Immer-powered state updates and `get` for reading current state:

```tsx
const counterStore = defineStore((set, get) => ({
  count: 0,
  increment: () => set((draft) => { draft.count++ }),
  double: () => set((draft) => { draft.count = get().count * 2 }),
}))

// Usage
const { count, increment } = counterStore.useStore()
```

### Return value

| Property | Type | Description |
|----------|------|-------------|
| `useStore()` | `() => State` | React hook — re-renders on state change |
| `getState()` | `() => State` | Get current state outside React |
| `setState(fn)` | `(fn: (draft) => void) => void` | Update state with Immer draft |
| `subscribe(fn)` | `(fn: (state, prevState) => void) => () => void` | Listen for changes, returns unsubscribe |

## `defineContextStore(initializer)`

Create a per-instance store with React context. SSR-safe (no shared global state between requests). Use this when the store holds per-request data like the current user or auth tokens. See [State Management — When to use global vs. context stores](/concepts/state-management/) for guidance.

```tsx
const { Provider, useStore } = defineContextStore(() => (set) => ({
  theme: 'light',
  toggle: () => set((d) => { d.theme = d.theme === 'light' ? 'dark' : 'light' }),
}))

// Wrap in Provider
<Provider>
  <App />
</Provider>

// Use in child components
const { theme, toggle } = useStore()
```

### Return value

| Property | Type | Description |
|----------|------|-------------|
| `Provider` | `React.FC<PropsWithChildren>` | Context provider — wrap your component tree |
| `useStore()` | `() => State` | React hook — reads from the nearest Provider |

## Selector pattern

For components that read a small slice of a large store, you can build a manual selector using `getState()` and `subscribe()` to avoid re-rendering when unrelated state changes:

```tsx
import { useSyncExternalStore } from 'react'

const appStore = defineStore((set) => ({
  count: 0,
  theme: 'light',
  notifications: [],
  increment: () => set((d) => { d.count++ }),
  addNotification: (n) => set((d) => { d.notifications.push(n) }),
}))

// Only re-renders when `count` changes
function CountBadge() {
  const count = useSyncExternalStore(
    appStore.subscribe,
    () => appStore.getState().count
  )
  return <span className="badge">{count}</span>
}
```

For most components, `useStore()` with direct destructuring is sufficient and recommended. The selector pattern is an optimization for specific performance-sensitive cases — use it when profiling shows unnecessary re-renders.

## Immer mutations

The `set` function receives an Immer draft — you can mutate it directly:

```tsx
set((draft) => {
  draft.items.push(newItem)      // push to array
  draft.count++                  // increment
  delete draft.temp              // delete property
  draft.nested.value = 'new'    // deep mutation
})
```

Immer ensures immutability under the hood. Each `set()` call produces a new state object, which triggers re-renders in components that use the store. You never need to spread or clone state manually.

## SSR hydration

During server-side rendering, global stores (`defineStore`) are serialized into the HTML as a `<script>` tag containing the store's state. On the client, the store reads this serialized state during hydration, so the client starts with the exact same state the server rendered.

This is automatic — you do not need to write any hydration code. The sequence is:

1. **Server**: Loader populates data → store is updated → React renders → store state is serialized into HTML
2. **Client**: HTML loads → store reads serialized state → React hydrates with matching state → no flash of default values

Context stores (`defineContextStore`) also participate in SSR hydration. Their state is serialized per-Provider, so each context instance hydrates independently.

If a store is updated after hydration (e.g., by a user interaction), the new state is not serialized — it lives only on the client until the next navigation or page reload.
