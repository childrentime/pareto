# Pareto SEO Keyword Priority List

Curated long-tail keywords Pareto's blog should target. Researched May 2026 across Google EN, 百度/知乎/掘金 ZH, and competitor SERP analysis.

**Strategy in one paragraph.** Pareto cannot win head terms ("react ssr", "next.js") — those SERPs are owned by Vercel docs, official React docs, and decade-old MDN pages. Long-tail is the only realistic play. Three buckets work for us: (1) **comparison/alternative queries** — high commercial intent, moderate competition; (2) **pain-driven queries** — searcher already has a problem, willing to read deeply; (3) **emerging-criticism queries** (esp. RSC fatigue) — low competition, growing volume. We have unique stories for all three because Pareto's actual differentiators (Vite-native, streaming-without-RSC, two-store SSR safety) map onto real searcher pain.

---

## Tier 1 — Write next (highest ROI, 4–6 weeks to rank)

Low-to-moderate competition, high commercial intent, Pareto's natural turf.

### EN-1. Pareto vs Next.js (comparison page)
- **Slug:** `compare/pareto-vs-nextjs` (or `blog/pareto-vs-nextjs`)
- **Primary:** "pareto vs next.js"
- **Secondary:** "next.js alternative streaming vite", "lightweight next.js alternative", "next.js bundle size alternative"
- **Searcher intent:** evaluator deciding between frameworks; willing to read tables, benchmarks
- **Pareto angle:** 73% smaller bundle, Vite-native HMR, streaming without RSC, no `"use client"` ceremony. Already have `benchmarks.md` to cite.
- **Suggested H1:** "Pareto vs Next.js: A Lightweight, Vite-Native Alternative"
- **Schema:** `ComparisonPage` + side-by-side feature table

### EN-2. Best lightweight React SSR framework 2026
- **Slug:** `blog/best-lightweight-react-ssr-framework`
- **Primary:** "best lightweight react ssr framework 2026"
- **Secondary:** "minimal react ssr setup", "react ssr without next.js", "fastest react ssr"
- **Searcher intent:** top-of-funnel evaluator surveying the landscape
- **Pareto angle:** position Pareto in a survey-style article (Remix, Vike, TanStack Start, Pareto, RedwoodJS). Honest comparison wins trust.
- **Suggested H1:** "The Best Lightweight React SSR Frameworks in 2026"

### EN-3. Vite SSR vs Next.js
- **Slug:** `blog/vite-ssr-vs-nextjs`
- **Primary:** "vite ssr vs next.js"
- **Secondary:** "vite-plugin-ssr alternative", "vite ssr framework comparison", "should I use vite for ssr"
- **Searcher intent:** developer migrating from CRA/Next, asking if Vite is ready for SSR
- **Pareto angle:** Pareto IS Vite-native SSR done right. Already have `vite-ssr-quickstart.md` to internal-link.

### EN-4. React hydration mismatch fix (evergreen pain)
- **Slug:** `blog/react-hydration-mismatch-fix`
- **Primary:** "react hydration mismatch error fix"
- **Secondary:** "text content does not match server-rendered html", "hydration error nextjs", "react hydration warning"
- **Searcher intent:** dev with a live bug, copy-paste-ready fix needed
- **Pareto angle:** explain root cause (one Node process, many concurrent renders), show how Pareto's `defineContextStore` and `<Await>` boundaries make hydration mismatches structurally impossible. Internal-link `ssr-state-trap.md`.
- **Suggested H1:** "How to Fix React Hydration Mismatches (and Why They Happen)"

### ZH-1. Next.js 替代 / 轻量 React SSR 框架
- **Slug:** `zh/blog/nextjs-alternatives`
- **Primary:** "next.js 替代框架"
- **Secondary:** "轻量 react ssr 框架", "next.js 替代方案", "vite ssr 框架对比"
- **Searcher intent:** 中文开发者寻找 Next.js 替代品，知乎/掘金/CSDN 几乎没有 Pareto 的占位内容 — **蓝海**
- **Pareto angle:** 横评 Remix / Vike / Pareto / TanStack Start / Razzle，诚实比较，Pareto 站在 "Vite-native + 流式 SSR" 这个独特位置
- **Suggested H1:** "2026 年值得尝试的 Next.js 替代框架：轻量级 React SSR 选型指南"

### ZH-2. React 服务端组件缺点 / RSC 替代方案
- **Slug:** `zh/blog/react-server-components-drawbacks`
- **Primary:** "react 服务端组件 缺点"
- **Secondary:** "RSC payload 问题", "react 服务端组件 替代方案", "use client 缺点"
- **Searcher intent:** 中文 React 用户在反思 RSC，掘金已有几篇但都偏理论，缺"那有什么替代"的实战角度
- **Pareto angle:** RSC 不是流式 SSR 的唯一路径。Pareto 用 `defer()` + Suspense 拿到一样的渐进渲染，没有 RSC 的 payload 膨胀和心智负担。
- **Suggested H1:** "React 服务端组件的三个真问题，以及一个不用 RSC 的替代方案"

---

## Tier 2 — Next quarter (moderate competition, evergreen)

### EN-5. Pareto vs TanStack Start
- **Slug:** `compare/pareto-vs-tanstack-start`
- **Primary:** "pareto vs tanstack start"
- **Secondary:** "tanstack start alternative", "tanstack start vs vike"
- TanStack Start is the closest neighbor in the Vite-SSR space. Side-by-side: routing API, loader API, streaming model.

### EN-6. Pareto vs React Router v7 (Framework Mode)
- **Slug:** `compare/pareto-vs-react-router-v7`
- **Primary:** "pareto vs react router v7"
- **Secondary:** "remix vs react router framework mode", "react router v7 ssr"

### EN-7. Why React Server Components aren't for everyone
- **Slug:** `blog/why-react-server-components-not-for-everyone`
- **Primary:** "react server components downsides"
- **Secondary:** "do I need server components", "rsc vs ssr streaming", "rsc payload size problem"
- Pareto's existing `streaming-ssr.md` is the strong base — this is the "broader case" version that captures RSC-fatigue traffic.

### EN-8. React 19 streaming SSR tutorial (renderToPipeableStream)
- **Slug:** `blog/react-19-streaming-ssr-tutorial`
- **Primary:** "renderToPipeableStream tutorial"
- **Secondary:** "react 19 streaming ssr", "suspense ssr example", "react streaming hydration"

### ZH-3. React hydration 报错排查
- **Slug:** `zh/blog/react-hydration-debug`
- **Primary:** "react hydration 报错"
- **Secondary:** "text content does not match", "服务端渲染 hydration 不匹配", "react ssr 报错"

### ZH-4. Vite SSR 实战教程
- **Slug:** `zh/blog/vite-ssr-tutorial`
- **Primary:** "vite ssr 教程"
- **Secondary:** "vite plugin ssr 教程", "vite 服务端渲染", "vite ssr 配置"

### ZH-5. 流式 SSR 原理与实战
- **Slug:** `zh/blog/streaming-ssr-explained`
- **Primary:** "react 流式渲染 实战"
- **Secondary:** "renderToPipeableStream 中文", "react suspense ssr", "流式 ssr 原理"

---

## Tier 3 — Long game (crowded, need link equity first)

Worth writing eventually but don't expect to outrank existing top-3 in <6 months without backlinks.

- "next.js alternative" (head term — naturally captured by EN-1/EN-2)
- "vite vs next.js" (commercial head term — captured by EN-3)
- "react ssr tutorial" (massive volume but fully owned by react.dev)
- "如何选择 react 框架" (knowledge query, dominated by 知乎)

---

## What every post must do (the SEO checklist)

1. **Primary long-tail keyword** in: `<title>`, H1, slug, first 100 words, `description` frontmatter (max 160 chars).
2. **Secondary keywords** sprinkled in H2s and naturally in the body.
3. **2–3 internal links** to existing Pareto blog posts or doc pages.
4. **1 external authority link** (React docs, MDN, or a referenced benchmark).
5. **GitHub link** to `https://github.com/childrentime/pareto` once.
6. **Closing CTA**: `npx create-pareto@latest my-app`.
7. **Schema markup** is auto-emitted by `Head.astro` (BlogPosting/TechArticle) — just write good frontmatter.
8. **External copies** (medium / dev.to / juejin) MUST set `canonical_url` to the paretojs.tech page **after** the website page exists.
9. **Honest comparisons** in `compare/` pages — name competitors' real strengths. Lying loses the reader and Google notices.
10. **No keyword stuffing.** Write for the human; the long-tail is the framing, not the filling.

---

## Internal-link map (for skill use)

When a new post is written, prefer these internal links by topic:

| Topic mentioned | Internal link |
|---|---|
| streaming SSR / Suspense / defer | `/blog/streaming-ssr/`, `/blog/slowest-api/` |
| benchmarks / performance | `/blog/benchmarks/`, `/blog/pareto-4/` |
| migration from Next.js | `/blog/nextjs-migration/` |
| meta tags / SEO / head | `/blog/head-tsx-seo/` |
| state management / SSR safety | `/blog/ssr-state-trap/` |
| routing / dynamic routes | `/blog/dynamic-routes/` |
| getting started | `/blog/vite-ssr-quickstart/`, `/start/` |

ZH versions live at the mirror path under `/zh/`.
