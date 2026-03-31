---
title: "@paretojs/core/store"
description: State management API — defineStore and defineContextStore.
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
const { Provider, useStore } = defineContextStore((initial: { theme: string }) => (set) => ({
  theme: initial.theme,
  toggle: () => set((d) => { d.theme = d.theme === 'light' ? 'dark' : 'light' }),
}))

// Wrap in Provider with initialData
<Provider initialData={{ theme: 'light' }}>
  <App />
</Provider>

// Use in child components
const { theme, toggle } = useStore()
```

### Return value

| Property | Type | Description |
|----------|------|-------------|
| `Provider` | `React.FC<{ children: ReactNode; initialData: Init }>` | Context provider — wrap your component tree |
| `useStore()` | `() => State` | React hook — reads from the nearest Provider |

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

Use `defineContextStore` to hydrate a store from server data. Pass loader data to `<Provider initialData={data}>`:

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

See a full example at [`examples/app/ssr-store/page.tsx`](https://github.com/childrentime/pareto/blob/main/examples/app/ssr-store/page.tsx).
