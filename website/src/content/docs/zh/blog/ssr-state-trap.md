---
title: "SSR 状态管理陷阱：defineStore vs defineContextStore"
description: 全局 store 会在服务端把用户数据串到别人那里。这是 SSR 应用里最危险的一类 bug。本文讲清楚它为什么会发生、Pareto 两种 store 怎么工作、什么时候该用哪一种。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 4 月 16 日</p>

你按 Next.js 风格上了一个 SSR 应用，带一个全局 user store。一个月后，用户报了个 bug："我登进去看到了另一个人的资料。" 你本地复现不出来。生产日志一点用没有。Session cookie 看着也正常。

真相是：你的全局 store 在服务端是个单例。在并发请求下，一个请求的 `setUser()` 写到了另一个请求正在读的同一个对象上。第二个用户命中一台热机，拿到了包含第一个用户数据的 hydration payload，在 React 对账前看到了零点几秒。

这就是 SSR 状态管理陷阱。它是服务端渲染里最老的陷阱之一，几乎每个框架都给你留了口子。本文讲：模块级它怎么发生、Pareto 的 `defineStore` 和 `defineContextStore` 怎么解决、以及选哪一个的决策规则。

## 为什么全局状态在服务端会跨请求泄漏

在浏览器里，你的应用是"一进程一用户"。模块级变量就是"一用户一变量"，没别人跟你共用。

在服务端，一个 Node 进程服务成千上万用户。模块级变量是**每个请求都共享的**。如果请求 A 在渲染时改了它，请求 B 在渲染时读它，B 看到的就是 A 的状态。

```ts
// state.ts（server 和 client 都会 import）
let currentUser = null

export function setCurrentUser(user) { currentUser = user }
export function getCurrentUser() { return currentUser }
```

浏览器里能用。服务端两个请求赛跑：

```
t=0ms:  请求 A 开始，调 setCurrentUser({ id: 'alice' })
t=1ms:  请求 B 开始，调 setCurrentUser({ id: 'bob' })
t=2ms:  请求 A 读 getCurrentUser() → { id: 'bob' }  ← 泄漏了
```

Alice 的 HTML 里写着 Bob 的名字。Alice 的 hydration payload 里是 Bob 的数据。服务端发给 Alice 浏览器的一切，现在引用的是 Bob。

这和你用不用状态库没关系。全局 `Map`、`module.cache`、`let` 声明——都一样脆弱。状态库只是把同样的模式包装了一层。

## Pareto 两种 store 在做什么

Pareto 有两个看起来几乎一样、但 SSR 行为相反的 API。

### defineStore —— 每个进程一个实例

```ts
import { defineStore } from '@paretojs/core/store'

const themeStore = defineStore((set) => ({
  mode: 'light' as 'light' | 'dark',
  toggle: () => set((d) => {
    d.mode = d.mode === 'light' ? 'dark' : 'light'
  }),
}))
```

服务端里，整个 Node 进程只有一个 `themeStore`。每个 SSR 请求读写同一份状态。**这是危险的原语。**

客户端里，每个浏览器 tab 一个 `themeStore`——这正是你想要的客户端状态行为。

### defineContextStore —— 每次 React 渲染一个实例

```ts
import { defineContextStore } from '@paretojs/core/store'

const { Provider, useStore } = defineContextStore((initialUser) => (set) => ({
  user: initialUser,
  setUser: (user) => set((d) => { d.user = user }),
}))
```

Context store 作用域限定在 `<Provider>`。每个 SSR 请求渲染自己的 provider 树，拿自己的 store 实例，看不到任何其他请求的状态。

```tsx
function App({ user }) {
  return (
    <Provider initialData={user}>
      <Dashboard />
    </Provider>
  )
}
```

两个并发请求创建两个隔离的 store。Alice 的渲染绝不会碰到 Bob 的 store。这个模式保证安全。

## 决策规则

问一句：**"这个 store 的初始状态，在不同用户或不同请求之间是否不同？"**

- **是** —— 用 `defineContextStore`。用户身份、auth token、每租户配置、依赖访问者的 feature flag、绑定 session 的购物车。
- **否** —— `defineStore` 没问题。UI 主题、侧边栏开合、最近关闭的 modal、键基于本就可共享的数据的客户端缓存。

"否"的推理是：如果每个 SSR 请求读到的初始状态都一样，并发请求之间就没什么可泄漏的。每个新请求主题都是 `'light'`，直到 JavaScript 水合、客户端读 `localStorage`。没有每请求状态，就没有泄漏面。

拿不准，选 `defineContextStore`。它永远安全。等你确认状态真的与请求无关，再降级到 `defineStore`。

## 一个会泄漏的例子和修复

一个真实会泄漏的模式：

```ts
// ❌ 坏：把用户身份放全局 store
import { defineStore } from '@paretojs/core/store'

export const userStore = defineStore((set) => ({
  user: null as User | null,
  setUser: (user: User) => set((d) => { d.user = user }),
  isAdmin: false,
}))
```

然后在 loader 或 layout 里：

```ts
// ❌ 在 SSR 期间写全局 store
export async function loader(ctx: LoaderContext) {
  const user = await getUserFromSession(ctx.request)
  userStore.setState((d) => {
    d.user = user
    d.isAdmin = user.role === 'admin'
  })
  return { user }
}
```

两个方向都会泄漏。并发请求互相覆盖 `d.user`。在另一个用户 session 之后到达的请求读到陈旧数据。bug 表现就是随机的"串号"报告。

修复：

```ts
// ✅ 好：context store，作用域限定在渲染内
import { defineContextStore } from '@paretojs/core/store'

export const { Provider: UserProvider, useStore: useUser } =
  defineContextStore((initial: { user: User; isAdmin: boolean }) => (set) => ({
    user: initial.user,
    isAdmin: initial.isAdmin,
    setUser: (user: User) => set((d) => { d.user = user }),
  }))
```

在根布局里把 app 包到 provider 里：

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

现在每个请求得到自己的 store 实例，用自己 loader 数据初始化。没有共享对象，没有泄漏路径。

## 什么时候 defineStore 是对的选择

不是所有 store 都危险。很多客户端状态在每个 SSR 请求都真的一样，只在水合之后才分化。

### UI 偏好

```ts
export const uiStore = defineStore((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  toggleSidebar: () => set((d) => { d.sidebarOpen = !d.sidebarOpen }),
  openCommandPalette: () => set((d) => { d.commandPaletteOpen = true }),
  closeCommandPalette: () => set((d) => { d.commandPaletteOpen = false }),
}))
```

服务端里每个请求都从 `sidebarOpen: true` 开始。没有用户数据，没有依赖请求的初始状态。安全。

### 纯客户端的 feature 开关

```ts
export const devStore = defineStore((set) => ({
  showDebugOverlay: false,
  toggleDebugOverlay: () => set((d) => { d.showDebugOverlay = !d.showDebugOverlay }),
}))
```

只有开发者自己用的调试 UI。每个请求初始状态一样，所有变更都发生在客户端。

### 共享只读内存缓存

启动时加载一次、每请求不变更的查找表：

```ts
export const countriesStore = defineStore((set) => ({
  countries: [] as Country[],
  loaded: false,
  load: async () => {
    const res = await fetch('/api/countries').then((r) => r.json())
    set((d) => {
      d.countries = res
      d.loaded = true
    })
  },
}))
```

如果这个函数只在客户端跑，没问题。一旦你在 SSR 期间调 `load()`，陷阱就回来了——一次请求里 fetch 的结果，下一个请求也能看到。

## "我就在每次请求开头重置一下"的把戏

大家意识到全局会泄漏后常试的模式：每次 SSR 请求开头重置 store。

```ts
// ❌ 不行
export async function loader(ctx) {
  userStore.setState(() => ({ user: null, isAdmin: false }))
  const user = await getUserFromSession(ctx.request)
  userStore.setState((d) => { d.user = user })
  return { user }
}
```

两个问题：

1. **重置和填充不是原子的。** 另一个请求可以在两步中间穿插进来，看到被重置的状态，或者在自己重置之前看到前一个请求的填充状态。
2. **多次渲染共享一个 store。** Pareto 流式 SSR 在 deferred promise 解析期间响应一直开着。这段窗口里，另一个请求可以跑过同一个 loader，把 store 覆盖掉。

"每请求重置" 正是 AsyncLocalStorage 要解决的问题，也是 Pareto 里 context store 的意义。不要用手动重置绕。

## Zustand / Jotai / Redux 呢？

原理一样。如果这个库默认 API 是模块级 store，服务端就不安全。大部分这些库都在文档里提供"SSR 模式"，要求你给每个请求实例化 store、通过 context 传下去。

Pareto 的 `defineContextStore` 就是把这个模式做成了一等 API。如果你从 Zustand 过来，`defineContextStore` 的形状你已经熟悉了——Zustand 的 `createStore` + React context wrapper——只不过内置好了。

Pareto 的 `defineStore` 是全局单例快捷方式，给那些你已经确认过可以安全走这条路的场景用。

## 更大的图景

SSR 给状态管理库增加了一个它们原本没设计过的维度。浏览器说"一个应用、一棵状态树、永远"。服务端说"一个进程、很多棵并发状态树、每棵只活几毫秒"。任何假装两者相同的 API，早晚会泄漏。

Pareto 的回答：两个 API，默认不同。

- `defineStore` 用于那种"一个进程一份状态"本来就是你想要的状态
- `defineContextStore` 用于那种"每棵渲染树一份状态"才是你需要的状态

按状态形状来选。选不出来，`defineContextStore` 永远不会错。

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

相关阅读：
- [状态管理文档](/zh/concepts/state-management/) —— 完整 API 参考
- [动态路由](/zh/blog/dynamic-routes/) —— Provider 在嵌套 layout 里该放哪
- [流式 SSR](/zh/blog/streaming-ssr/) —— 响应为什么会在渲染期间一直开着

<style>
{`
  .blog-meta {
    font-size: 0.875rem;
    color: var(--sl-color-gray-3);
    margin-bottom: 2rem;
  }
  .blog-meta a {
    color: var(--sl-color-accent);
  }
`}
</style>
