# The SSR State Management Trap: defineStore vs defineContextStore

You ship a Next.js-style SSR app with a global user store. A month later, a user files a bug: "I logged in and saw someone else's profile." You can't reproduce it locally. Production logs are useless. The session cookie looks fine.

What happened: your global store is a singleton on the server. Under concurrent requests, one request's `setUser()` wrote to the same object another request was reading. The second user hit a warm server, got a hydration payload containing the first user's data, and saw it for a split second before React reconciled.

This is the SSR state management trap. It's one of the oldest footguns in server rendering, and almost every framework makes it possible. In this post: how it happens at the module level, how [Pareto](https://github.com/childrentime/pareto)'s `defineStore` and `defineContextStore` address it, and the decision rule for which one to use.

## Why global state leaks across requests on the server

In the browser, your app is one process per user. A module-level variable is a per-user variable — there's no one else sharing it.

On the server, one Node process serves thousands of users. A module-level variable is **shared across every request**. If request A mutates it during its render, and request B reads it during its render, B sees A's state.

```ts
// state.ts (imported by server and client)
let currentUser = null

export function setCurrentUser(user) { currentUser = user }
export function getCurrentUser() { return currentUser }
```

Works in the browser. On the server, two requests racing through:

```
t=0ms:  Request A starts, calls setCurrentUser({ id: 'alice' })
t=1ms:  Request B starts, calls setCurrentUser({ id: 'bob' })
t=2ms:  Request A reads getCurrentUser() → { id: 'bob' }  ← leaked
```

Alice's rendered HTML contains Bob's name. Alice's hydration payload contains Bob's data. Whatever the server sends to Alice's browser now references Bob.

This doesn't require a state library. A global `Map`, a `module.cache`, a `let` declaration — all vulnerable. State libraries just dress up the same pattern.

## What Pareto's two store types do

Pareto has two APIs that look almost identical but have opposite SSR behavior.

### defineStore — one instance per process

```ts
import { defineStore } from '@paretojs/core/store'

const themeStore = defineStore((set) => ({
  mode: 'light' as 'light' | 'dark',
  toggle: () => set((d) => {
    d.mode = d.mode === 'light' ? 'dark' : 'light'
  }),
}))
```

On the server, there's one `themeStore` per Node process. Every SSR request reads and writes the same state. **This is the dangerous primitive.**

On the client, there's one `themeStore` per browser tab — which is what you actually want for client-side state.

### defineContextStore — one instance per React render

```ts
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((initialUser) => (set) => ({
  user: initialUser,
  setUser: (user) => set((d) => { d.user = user }),
}))
```

Context stores are scoped to a `<Provider>`. Each SSR request renders its own provider tree, gets its own store instance, and can't see any other request's state.

Two concurrent requests create two isolated stores. Alice's render never touches Bob's store. The pattern is guaranteed safe.

## The decision rule

Ask: **"Does the initial state of this store differ per user or per request?"**

- **Yes** — use `defineContextStore`. User identity, auth tokens, per-tenant config, feature flags that depend on the viewer, shopping cart tied to a session.
- **No** — `defineStore` is fine. UI theme, sidebar open/closed, recently-viewed modals, client-side caches keyed on data that's already safe to share.

For the "no" case, the reasoning is: if every SSR request reads the same initial state, there's nothing for concurrent requests to leak to each other. The theme is `'light'` for every new request until JavaScript hydrates and the client reads `localStorage`. No per-request state, no leak surface.

If you're ever unsure, pick `defineContextStore`. It's always safe.

## A leaky example and its fix

Here's a realistic pattern that leaks:

```ts
// ❌ Bad: user identity in a global store
import { defineStore } from '@paretojs/core/store'

export const userStore = defineStore((set) => ({
  user: null as User | null,
  setUser: (user: User) => set((d) => { d.user = user }),
  isAdmin: false,
}))
```

Then in a loader or layout:

```ts
// ❌ Mutating a global store during SSR
export async function loader(ctx: LoaderContext) {
  const user = await getUserFromSession(ctx.request)
  userStore.setState((d) => {
    d.user = user
    d.isAdmin = user.role === 'admin'
  })
  return { user }
}
```

This leaks in both directions. Concurrent requests overwrite `d.user`. Requests that arrive after a previous user's session read stale data. The bug looks like random user-mixup reports.

The fix:

```ts
// ✅ Good: context store, scoped to the render
import { defineContextStore } from '@paretojs/core/store'

export const { Provider: UserProvider, useStore: useUser } =
  defineContextStore((initial: { user: User; isAdmin: boolean }) => (set) => ({
    user: initial.user,
    isAdmin: initial.isAdmin,
    setUser: (user: User) => set((d) => { d.user = user }),
  }))
```

Wrap the app in a provider in the root layout:

```tsx
// app/layout.tsx
import { UserProvider } from './stores/user'

export default function RootLayout({ children, loaderData }) {
  const { user, isAdmin } = loaderData as LoaderData
  return (
    <UserProvider initialData={{ user, isAdmin }}>
      {children}
    </UserProvider>
  )
}
```

Now every request gets its own store instance, initialized from its own loader data. No shared object. No leak path.

## When defineStore is the right call

Not every store is dangerous. Plenty of client-state is genuinely the same on every SSR request and only diverges after hydration.

```ts
// UI preferences — safe as a global
export const uiStore = defineStore((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((d) => { d.sidebarOpen = !d.sidebarOpen }),
}))
```

On the server, every request starts with `sidebarOpen: true`. No user data, no request-dependent initial state. Safe.

## The "I'll just reset it at the start of each request" trick

A pattern people try when they realize globals leak: reset the store at the start of every SSR request.

```ts
// ❌ Doesn't work
export async function loader(ctx) {
  userStore.setState(() => ({ user: null, isAdmin: false }))
  const user = await getUserFromSession(ctx.request)
  userStore.setState((d) => { d.user = user })
  return { user }
}
```

Two problems:

1. **Reset and populate are not atomic.** Another request can interleave between them.
2. **Multiple renders share one store.** Pareto's streaming SSR holds a response open while deferred promises resolve. During that window, another request can run through the same loader and overwrite the store.

The "reset per request" pattern is what AsyncLocalStorage exists to solve, and what context stores are in Pareto. Don't try to work around it with manual resets.

## What about Zustand / Jotai / Redux?

Same principle. If the library's default API is a module-level store, it's unsafe on the server. Most of these libraries document an "SSR mode" that requires you to instantiate a per-request store and pass it through context.

Pareto's `defineContextStore` is that pattern as a first-class API. `defineStore` is the global-singleton shortcut for cases where you've verified the shortcut is safe.

## The bigger pattern

SSR adds a dimension most state management libraries weren't originally designed for. The browser gave you "one app, one state tree, forever." The server gives you "one process, many concurrent state trees, for a few milliseconds each." Any API that pretends these are the same will eventually leak.

Pareto's answer: two APIs with different defaults.

- `defineStore` for state where "one process, one state" is genuinely what you want
- `defineContextStore` for state where "each render tree, its own state" is what you need

Pick the one that matches the shape of the state. If you can't decide, `defineContextStore` is never wrong.

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) is a lightweight, streaming-first React SSR framework built on Vite. [Documentation](https://paretojs.tech)*
