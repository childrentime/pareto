# Pareto SEO Strategy

## Target Keywords

### Primary (high intent)
- `react ssr framework`
- `lightweight react ssr`
- `react streaming ssr`
- `next.js alternative lightweight`
- `vite react ssr`

### Secondary (feature-specific)
- `react file-based routing`
- `react server side rendering streaming`
- `react defer suspense streaming`
- `react ssr streaming vite`
- `react state management immer`
- `react error boundary ssr`

### Long-tail (tutorial/guide)
- `how to add streaming to react ssr`
- `react ssr without next.js`
- `lightweight react framework 2025`
- `react ssr with vite setup`
- `react suspense streaming example`

## Site Architecture

```
paretojs.dev/
  /                           # Landing page (hero + features + code example)
  /docs/
    /getting-started           # Quick start guide
    /concepts/
      /routing                 # File-based routing
      /streaming               # SSR streaming with defer()
      /state-management        # defineStore + immer
      /error-handling          # error.tsx + error boundaries
      /head-management         # head.tsx + meta tags
      /env-variables            # Environment variables
      /resource-routes         # API endpoints via route.ts
      /redirects-and-404       # redirect() + notFound()
    /api/
      /core                    # @paretojs/core exports
      /store                   # @paretojs/core/store exports
      /config                  # pareto.config.ts
    /guides/
      /migrating-from-nextjs   # Migration guide (SEO gold)
      /deploy-to-vercel        # Deployment guides
      /deploy-to-node
      /tailwind-css            # Integration guides
  /blog/
    /why-not-server-components # Existing blog post
    /pareto-v3-announcement    # Launch post
    /streaming-ssr-explained   # Technical deep-dive
    /nextjs-vs-pareto          # Comparison page (high SEO value)
```

## Content Strategy

### Phase 1: Foundation (now)
1. Landing page with clear value proposition
2. Getting Started guide (5-minute quickstart)
3. Core concept pages (routing, streaming, state, errors)
4. API reference

### Phase 2: Growth
1. "Migrating from Next.js" guide (captures search intent)
2. "Next.js vs Pareto" comparison page
3. Blog posts with code examples
4. Integration guides (Tailwind, deployment)

### Phase 3: Authority
1. Case studies / benchmarks
2. Performance comparisons
3. Community showcase
4. Advanced patterns blog posts

## Technical SEO Requirements

### Meta tags (per page)
- Unique `<title>` with keyword + brand: `"Streaming SSR — Pareto Docs"`
- `<meta name="description">` with actionable summary
- `<meta property="og:title/description/image">`
- `<link rel="canonical">`

### Schema markup
- `SoftwareApplication` on landing page
- `TechArticle` on docs pages
- `BreadcrumbList` on all pages
- `FAQPage` on comparison/migration pages

### Performance targets
- LCP < 1.5s (static docs site)
- CLS = 0 (system fonts, no layout shift)
- FID < 100ms

### AI search readiness
- Add `/llms.txt` with framework summary
- Ensure pages have clear, extractable passages
- Use structured headings (H1 > H2 > H3)
- Include code examples inline (AI crawlers extract these)

## Competitive Landscape (from research)

| Framework | Doc Pages | Blog Posts | Primary Traffic Source |
|-----------|-----------|------------|----------------------|
| **Astro** | 300-350 | 180+ | 60% direct / 35% organic |
| **Remix** | ~165 | 50 | 48% organic / 27% direct |
| **Qwik** | ~130 | Minimal | N/A |
| **Vike** | ~80-100 | Minimal | Legacy vite-plugin-ssr redirects |
| **SolidStart** | ~40-50 | Minimal | Parent domain (solidjs) |
| **Pareto** | ~5 (current) | 2 | Near zero |

### Direct Competitor: Vike
- Only ~100 pages, targets "add SSR to Vite" niche
- Benefits from legacy vite-plugin-ssr.com redirect (backlink equity)
- Pareto can compete directly in the "Vite + React SSR" space

### Key Opportunities (from competitor gaps)
1. **"Vite + React SSR" content gap** — Vike is the only competitor, with small footprint
2. **Migration guides** — "Migrate from Next.js/CRA to Pareto" (high-intent traffic)
3. **Comparison pages** — "Pareto vs Next.js", "Pareto vs Vike" (alt-seeking devs)
4. **LLMO (LLM Optimization)** — TanStack Start pioneering this; early adoption is strategic
5. **Integration guides** — Astro drives massive long-tail traffic from 80+ integration guides

### Feature Comparison

| Feature | Next.js | Remix | Vike | Pareto |
|---------|---------|-------|------|--------|
| Bundle size | Heavy | Medium | Light | Minimal |
| Learning curve | Steep | Medium | Medium | Low |
| Streaming SSR | Yes (RSC) | Yes (defer) | Manual | Yes (defer) |
| Build tool | Webpack/Turbopack | Vite | Vite | Vite 7 |
| State management | None built-in | None built-in | None | Built-in (zustand+immer) |
| Config complexity | High | Medium | Low | Minimal |
| File conventions | Many | Many | Few | Familiar (Next.js-like) |

**Key differentiator:** "Everything you need, nothing you don't."

## KPI Targets

| Metric | Now | 3 Month | 6 Month | 12 Month |
|--------|-----|---------|---------|----------|
| GitHub Stars | ~200 | 500 | 1,500 | 5,000 |
| npm weekly downloads | ~50 | 200 | 1,000 | 5,000 |
| Indexed pages | 5 | 20 | 40 | 60+ |
| "react ssr framework" rank | >100 | 50 | 20 | 10 |
| Organic traffic/mo | 0 | 500 | 2,000 | 10,000 |
