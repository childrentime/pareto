# Pareto v3 — Progress

## Overview

Ground-up rewrite of the Pareto SSR framework. Dropped all legacy code, designed a new architecture supporting SSR/SSG, client-side navigation, Tailwind CSS, and built-in zustand+immer state management. Build system: Vite 7.

---

## Current Architecture

### Build System: Vite 7

```
pareto dev
  └── Vite createServer({ middlewareMode: true })
        ├── Vite middleware (HMR, module serving, React Fast Refresh)
        ├── paretoVirtualEntry plugin (virtual:pareto/server-entry, virtual:pareto/client-entry)
        ├── vite.ssrLoadModule('virtual:pareto/server-entry') — SSR with hot-reload
        ├── .env file loading (.env, .env.local, .env.{mode}, .env.{mode}.local)
        ├── Optional app.ts — user-provided Express app
        └── Express handles routing → SSR handler

pareto build
  ├── 1. vite.build() — client bundle (manifest, code splitting)
  │   └── input: 'virtual:pareto/client-entry'
  │   └── envPrefix: 'PARETO_' (client-side env vars)
  ├── 2. Read .vite/manifest.json → client entry JS/CSS URLs
  ├── 3. vite.build({ ssr }) — server bundle (CJS, with client URLs)
  │   └── input: 'virtual:pareto/server-entry'
  ├── 4. Copy public/ → .pareto/static/
  ├── 5. Write production server entry (.pareto/index.js)
  │   └── Includes: .env loading, security headers, optional app.ts
  └── 6. SSG: render static routes → .pareto/client/*.html

pareto start
  └── Express serves static + SSR from .pareto/ output
```

### Build Output (packages/core)

Unified to single `dist/` directory via tsup dual-config:

```
dist/
├── index.{js,mjs,d.ts}       # Runtime library (CJS + ESM + types)
├── node.{js,mjs,d.ts}        # Server-only exports
├── client.{js,mjs,d.ts}      # Client-only exports
├── store/index.{js,mjs,d.ts} # State management exports
└── cli.mjs                   # CLI entry (ESM, shebang)
```

### Module Map

```
packages/core/src/
├── cli/                        # CLI 命令
│   ├── index.ts                  cac 定义 dev/build/start + .env loading
│   ├── dev.ts                    Vite createServer + app.ts loading + security headers
│   ├── build.ts                  Vite build (client + server) + manifest + SSG + app.ts
│   └── start.ts                  加载生产服务器入口
│
├── config/                     # 构建配置
│   ├── app.ts                    findAppFile / loadApp — 加载用户自定义 Express app
│   ├── env.ts                    loadEnv — .env 文件解析 (.env/.env.local/.env.{mode})
│   ├── vite.ts                   createClientConfig / createServerConfig / getCoreSourceAliases
│   ├── defaults.ts               ParetoConfig 默认值 (appDir, outDir, configureVite)
│   ├── load.ts                   异步加载 pareto.config.ts
│   └── index.ts                  导出
│
├── server/                     # 服务端中间件
│   └── security-headers.ts       默认安全头 (X-Content-Type-Options, X-Frame-Options, etc.)
│
├── plugins/                    # Vite 插件
│   └── virtual-entry.ts          paretoVirtualEntry: virtual:pareto/server-entry, client-entry
│
├── router/                     # 路由系统
│   ├── route-scanner.ts          文件系统扫描: page.tsx/route.ts/layout.tsx/head.tsx/loader.ts/not-found.tsx
│   ├── route-matcher.ts          URL 匹配 + 参数提取 + layout diff
│   ├── context.tsx               RouterProvider (History API, prefetch cache, deferred data)
│   ├── link.tsx                  <Link> 组件 (hover/viewport prefetch, SPA 导航)
│   ├── use-router.ts             useRouter() hook
│   ├── head-manager.ts           head 合并 + 客户端 head 更新
│   └── index.ts
│
├── render/                     # 渲染管线
│   ├── server.tsx                createRequestHandler (route match → loader → renderToPipeableStream)
│   │                             处理 /__pareto/data 端点 + /__pareto/deferred
│   ├── client.tsx                startClient (hydration + SPA router) / hydrateApp
│   ├── deferred-script.tsx       流式注入 deferred data 的 <script> 组件
│   ├── document.tsx              HTML document shell
│   ├── error-boundary.tsx        ParetoErrorBoundary class component
│   └── index.ts
│
├── data/                       # 数据层
│   ├── use-loader-data.ts        useLoaderData() + LoaderDataContext
│   ├── streaming.ts              Await 组件 + useStreamData + isDeferredData + serializeDeferredData
│   └── index.ts
│
├── store/                      # 状态管理 (zustand+immer)
│   ├── core.ts                   createStoreApi (immer produce, subscribe)
│   ├── define-store.ts           defineStore → { useStore, getState, setState, subscribe }
│   ├── define-context-store.ts   defineContextStore → { Provider, useStore } (SSR 安全)
│   ├── hydration.ts              dehydrate / getHydrationData / hydrateStores
│   └── index.ts
│
├── entry/                      # 入口代码生成
│   ├── generate.ts               generateServerEntry / generateUnifiedClientEntry
│   └── index.ts
│
├── __tests__/                  # 单元测试 (vitest)
│   ├── build.test.ts
│   ├── config.test.ts
│   ├── env.test.ts               .env 文件解析测试
│   ├── error-boundary.test.ts
│   ├── head-manager.test.ts
│   ├── hydration.test.ts
│   ├── response-helpers.test.ts
│   ├── router-matcher.test.ts
│   ├── router-scanner.test.ts
│   ├── security-headers.test.ts  安全头中间件测试
│   ├── app-file.test.ts          app.ts 发现/加载测试
│   ├── store.test.ts
│   ├── streaming.test.ts
│   ├── types.test.ts
│   └── virtual-entry.test.ts
│
├── types.ts                    # 类型定义 (RouteDef, LoaderContext, ParetoConfig, DeferredData)
├── index.ts                    # 主入口导出
├── client.ts                   # 客户端导出
└── node.ts                     # 服务端导出
```

### Data Flow

```
Loader 只做数据读取 (纯函数):
  export function loader({ req, params }) → data

Mutation 走显式 API route:
  app/api/comments/route.ts
    export function action({ req }) → db.insert(req.body)
  客户端直接 fetch('/api/comments', { method: 'POST' })

SSR + Store 结合:
  defineContextStore<State, LoaderData>((loaderData) => (set) => ({
    products: loaderData.products,  // 来自 SSR
    cart: [],                       // 客户端状态
    addToCart: (p) => set(draft => { draft.cart.push(p) }),
  }))
  → Page 中 <Provider initialData={useLoaderData()}> 注入
```

### Server Customization: `app.ts`

用户在项目根目录放 `app.ts`，导出 Express 实例，完全控制中间件：

```ts
// app.ts
import express from 'express'
const app = express()
app.use(cors())
app.use('/admin', authMiddleware())
export default app
```

- 有 `app.ts` → 框架使用用户的 app，安全头由用户自己管
- 没有 `app.ts` → 框架创建默认 app + 自动加安全头
- 支持 `.ts` / `.mts` / `.js` / `.mjs`

### Environment Variables

```
加载顺序（后者覆盖前者，但不覆盖已有 process.env）:
  .env              — 始终加载
  .env.local        — 始终加载，应 gitignore
  .env.{mode}       — 仅匹配模式加载
  .env.{mode}.local — 仅匹配模式加载，应 gitignore

客户端访问:
  PARETO_ 前缀的变量通过 Vite envPrefix 暴露给客户端代码
  import.meta.env.PARETO_API_URL

服务端访问:
  所有变量通过 process.env 访问
```

### Security Headers (默认)

无 `app.ts` 时自动设置:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: interest-cohort=()`
- `X-XSS-Protection: 1; mode=block`
- `X-DNS-Prefetch-Control: off`

### Request Flow

```
Browser Request: GET /stream
  │
  ├─ Dev Mode (pareto dev)
  │   ├── Express receives request (user's app.ts or default)
  │   ├── Security headers middleware (default app only)
  │   ├── Vite middleware: skip (not a module/HMR request)
  │   ├── vite.ssrLoadModule('virtual:pareto/server-entry')
  │   │     └── paretoVirtualEntry plugin → generateServerEntry()
  │   ├── createRequestHandler:
  │   │     ├── matchRoute('/stream') → { route, params }
  │   │     ├── runLoaders({ req, res, params }) → loaderData (DeferredData)
  │   │     ├── Wrap: RouterProvider > LoaderDataContext > Layout(s) > Suspense > Page
  │   │     └── renderToPipeableStream(Document({ scripts, dataScript, ... }))
  │   └── Response: streamed HTML
  │
  ├─ Client Hydration
  │   ├── virtual:pareto/client-entry → generateUnifiedClientEntry()
  │   ├── startClient(routes):
  │   │     ├── Read __ROUTE_DATA__, __MATCHED_ROUTE__
  │   │     ├── Build lazy route components via import()
  │   │     └── hydrateRoot(root, <RouterProvider><Layout><Page></...>)
  │   └── React hydrates → event handlers active → <Link> uses History API
  │
  └─ Client Navigation: Click <Link href="/stream">
        ├── Link.onClick: e.preventDefault()
        ├── RouterProvider.push('/stream'):
        │     ├── fetch('/__pareto/data?path=/stream') → { data, params }
        │     ├── startTransition(() => { setLoaderData, setCurrentPath })
        │     └── history.pushState(null, '', '/stream')
        └── React re-renders → new page shown, no full reload
```

---

## Example App

```
examples/app/
├── page.tsx            首页: Feature 列表 + 代码示例 (SSG)
├── layout.tsx          全局 layout: header nav + main
├── globals.css         Tailwind 全局样式
├── stream/page.tsx     Streaming SSR: defer() + Await + Suspense skeleton
├── store/page.tsx      状态管理: defineStore + immer draft + useStore 解构
├── ssr-store/page.tsx  SSR + Store: defineContextStore + loader 数据初始化 + 购物车
├── blog/               动态路由 + 嵌套 layout + SSG
│   ├── layout.tsx        嵌套 layout (blog 共享头部)
│   ├── page.tsx          博客列表 (SSG)
│   └── [slug]/page.tsx   动态路由 + staticParams() 静态生成
├── error-demo/         错误处理: ParetoErrorBoundary 局部错误、loader 错误
├── redirect-demo/      重定向: redirect() + notFound()
├── head-demo/          Head 管理: per-route title + meta
├── api/time/route.ts   Resource Route: JSON API 端点
└── not-found.tsx       404 页面
```

---

## Verification Results (latest)

| Check | Result |
|-------|--------|
| `tsc --noEmit` (core) | 0 errors |
| `tsc --noEmit` (examples) | 0 errors |
| `vitest run` | 125/125 unit tests passing (15 test files) |
| `playwright test` | E2E tests (SSR/hydration/navigation/store/ssr-store/streaming/errors/redirect/404/head/security-headers/CSS/CLS) |

---

## Design Decisions

### 删除的模块 (v3 精简)

| 模块 | 删除原因 |
|------|----------|
| `useMutation` | mutation 走 API route + fetch，不绑页面路由 |
| `useRevalidator` | 刷新数据用 client store 管理 |
| `ActionFunction` / `ActionContext` | 页面路由不再有 action |
| `actionPath` (RouteDef) | 页面路由不扫 `action.ts` |
| `handleActionRequest` | 不再处理 `X-Pareto-Action` |
| `pareto:revalidate` 事件 | 不再需要 |
| `configureServer` (ParetoConfig) | 被 `app.ts` 替代，零学习成本 |
| `loading.tsx` 约定文件 | Suspense fallback 由用户自己用 `<Await fallback>` 控制更精确 |
| `error.tsx` 约定文件 | 不需要，用 `ParetoErrorBoundary` 组件包裹局部区域更灵活 |

### 设计理念

- **Loader 纯数据**: loader 只做读取，mutation 走显式 API route
- **app.ts > configureServer**: 直接写 Express 代码，不需要学框架 API
- **defineContextStore + SSR**: SSR 数据通过 Provider initialData 注入 store
- **安全头默认开启**: 无 app.ts 时自动设置 OWASP 推荐头
- **.env 零配置**: 自动加载 .env 文件，PARETO_ 前缀暴露给客户端

---

## History

1. Initial v2 rewrite — Rspack + SWC
2. Rspack → Vite 7 migration
3. 架构修复 — Server/Client 对齐、CSS FOUC 修复
4. E2E 测试 — Playwright
5. v3 重构 — 构建产物精简、Vite 虚拟模块、Demo 专业化
6. SSG + Head 合并 + 生成修复
7. P0/P1 生产级修复 — Error Boundary、redirect/notFound、Resource Routes
8. Route Manifest + Client Redirect + Example
9. Example 优化 + 框架 Bug 修复
10. 脚手架 + 文档站 + SEO
11. **生产化 (2026-03-26)**:
    - **.env 支持**: 自动加载 .env 文件，支持 mode-specific (.env.production)，PARETO_ 前缀暴露给客户端
    - **安全头**: 默认设置 OWASP 推荐安全头 (X-Content-Type-Options, X-Frame-Options, Referrer-Policy 等)
    - **app.ts 机制**: 替代 configureServer hook，用户导出 Express 实例完全控制中间件
    - **SSR + Store demo**: defineContextStore 示例，SSR 数据初始化 store + 客户端购物车
    - **API 精简**: 删除 useMutation、useRevalidator、ActionFunction/ActionContext、页面路由 action 支持
    - **loading.tsx 移除**: Suspense fallback 由 `<Await fallback>` 精确控制，不需要约定文件
    - **Blog demo**: 动态路由 `[slug]`、嵌套 layout、`staticParams()` SSG 生成、per-route head
    - **.gitignore**: 添加 `.env*` 模式防止敏感文件误提交
    - **测试**: 89 → 125 单元测试 (15 test files)，新增 env/security-headers/app-file 测试
12. **DX 改进 (2026-03-26)**:
    - **导航闪烁修复**: `window.scrollTo` 移到 `useLayoutEffect`，在 React 提交新 DOM 后再滚动，消除页面跳转闪烁
    - **默认端口 3000**: dev 默认 3000 (原 4000)，端口被占用时自动递增 (3001, 3002...)
    - **progress.md 清理**: 移除过时的 error.tsx 约定文件引用，route-scanner 文件列表对齐实际代码
