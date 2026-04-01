# Store Architecture

## Module Structure

```
store/
  core.ts                 # Low-level store engine (Immer + pub/sub)
  define-store.ts         # Global store with per-property proxy subscriptions
  define-context-store.ts # Context-scoped store (SSR-safe, per-Provider instance)
  index.ts                # Public exports: defineStore, defineContextStore
```

## Core Engine (`core.ts`)

`createStoreApi` is the foundation for both `defineStore` and `defineContextStore`. It provides:

- **State container** — holds the current state value
- **Immer-based mutations** — `setState(draft => { ... })` produces the next immutable state via `produce()`
- **Pub/sub** — `subscribe(listener)` registers callbacks that fire on every state transition with `(nextState, prevState)`

The engine is framework-agnostic — it has no React dependency.

## Global Store (`define-store.ts`)

`defineStore(createState)` builds on `createStoreApi` and adds **per-property reactive subscriptions** via a proxy object.

### How `useStore()` works

`useStore()` returns a proxy where each property getter calls `useSyncExternalStore` independently:

```
useStore() → proxy object
  proxy.count   → useSyncExternalStore(subscribe, () => getState().count)
  proxy.theme   → useSyncExternalStore(subscribe, () => getState().theme)
```

When you destructure `const { count } = useStore()`, only the `count` getter fires, so the component only subscribes to `count`. Changes to `theme` do not trigger a re-render. No manual selectors needed.

### Exposed API

`defineStore` returns `{ useStore, getState, setState, subscribe }` — a minimal surface. The internal `createBoundStore` and `createEnhancedStore` layers are not exposed.

## Context Store (`define-context-store.ts`)

`defineContextStore(init => createState)` provides per-Provider store instances via React context:

- **Provider** — creates a `StoreApi` on first render (via `useRef`) and provides it through `StoreContext`
- **useStore()** — reads the nearest Provider's store and builds the same per-property proxy as `defineStore`
- **SSR-safe** — each Provider instance is independent, so concurrent SSR requests never share state

The `initialData` prop flows through the curried initializer: `createState(initialData)` returns a `StateCreator`, which `createStoreApi` consumes.

## Data Flow

```
defineStore:
  createState(set, get) → initial state
  setState(draft => ...) → Immer produce → new state → notify listeners
  useStore().property → useSyncExternalStore → re-render on that property

defineContextStore:
  <Provider initialData={data}>
    createState(data)(set, get) → initial state → stored in useRef
    useStore() → useContext → same proxy pattern as defineStore
```

## Design Decisions

- **Proxy over selectors** — The per-property proxy eliminates the need for selector functions. `const { x } = useStore()` is both the simplest API and the most granular subscription.
- **Immer over manual immutability** — `set(draft => { draft.x++ })` is more readable than spread-based updates, especially for nested state.
- **No barrel re-exports** — `index.ts` only exports `defineStore` and `defineContextStore`. Internal modules (`core.ts`, etc.) are not part of the public API.
