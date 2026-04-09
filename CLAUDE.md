## Publishing

- **Always use `pnpm publish`**, never `npm publish`. This repo uses pnpm's `catalog:` protocol in peerDependencies — `npm publish` ships the raw `catalog:` string, which breaks installs for users.
- Add `--registry https://registry.npmjs.org` since the local `.npmrc` points to npmmirror.
- For `create-pareto`, run `pnpm templates` before publishing to regenerate templates with resolved `workspace:*` and `catalog:` versions.
- Full command: `pnpm publish --access public --no-git-checks --registry https://registry.npmjs.org`

## Blog Publishing

### Critical: website post MUST exist before external copies

Every blog post lives in two places:

1. **Website canonical post** (required, must exist first):
   - `website/src/content/docs/blog/{slug}.md` — English
   - `website/src/content/docs/zh/blog/{slug}.md` — Simplified Chinese
   - Also add entries to both `index.mdx` files

2. **External platform copies** (optional, published later):
   - `blog-external/post-N-{slug}/medium.md`
   - `blog-external/post-N-{slug}/devto.md`
   - `blog-external/post-N-{slug}/juejin.md`

**Why this order matters:** External posts set `canonical_url` to `https://paretojs.tech/blog/{slug}/`. If the website page doesn't exist, the canonical URL 404s — which is worse than no canonical at all for SEO. Always create and verify the website page first, then write the external copies.

### Website post format

Match the existing blog posts (`pareto-4.md`, `benchmarks.md`):

```markdown
---
title: "..."
description: ...
template: splash
---

<p class="blog-meta">By <a href="https://github.com/childrentime">childrentime</a> · Month D, YYYY</p>

...body...

<style>
{`
  .blog-meta { font-size: 0.875rem; color: var(--sl-color-gray-3); margin-bottom: 2rem; }
  .blog-meta a { color: var(--sl-color-accent); }
`}
</style>
```

Chinese version uses `作者：... · YYYY 年 M 月 D 日`. Internal links should use site-relative paths (`/blog/benchmarks/`, `/zh/concepts/routing/`), never absolute `https://paretojs.tech/...`.

### External copies

Stored in `blog-external/` with sequential numbering:

```
blog-external/
  post-N-{slug}/
    medium.md   # English, no frontmatter (for Medium push skill)
    devto.md    # English, with dev.to frontmatter (published: false)
    juejin.md   # Chinese (simplified), no frontmatter (user copies manually)
```

- **dev.to**: YAML frontmatter with `published: false`, `tags`, `canonical_url` pointing to the **already-existing** paretojs.tech blog post.
- **Medium**: Plain markdown, no frontmatter. Starts with `# Title`.
- **掘金 (Juejin)**: Plain markdown in Chinese, no frontmatter.

### External publishing workflow

After the website posts are in place, for each batch:

1. Create `blog-external/post-N-{slug}/` with `medium.md`, `devto.md`, `juejin.md`
2. **Only publish the first post** of each batch to all 3 platforms:
   - **Medium**: Use the `/medium-push` skill with the `medium.md` file
   - **dev.to**: POST via API using `DEV_TO_API_KEY` from `.env` (set `published: false` as draft)
   - **Juejin (掘金)**: Tell user to copy from `juejin.md` (no API available)
3. The remaining posts are saved in `blog-external/` for future publishing

### dev.to API

Note: `.env` uses the variable name `DEV_TO_API_KEY` (with underscores). The dev.to API rejects Python urllib's default User-Agent with 403 — use `curl` (or set a custom UA).

```bash
curl -s -X POST https://dev.to/api/articles \
  -H "api-key: $DEV_TO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"article": {"title": "...", "body_markdown": "...", "published": false, "tags": ["react","javascript","ssr","webdev"], "canonical_url": "https://paretojs.tech/blog/{slug}/"}}'
```

## Code Conventions

- **No barrel files** — Do not create `index.ts` re-export files. Import directly from the source module (e.g. `from '../ndjson/reader'`, not `from '../ndjson'`). Barrel files add indirection without value.

## Design Context

### Users
Web developers evaluating or using Pareto as their React SSR framework. Technically experienced, likely familiar with Next.js or Remix, looking for a lightweight streaming-first alternative. They encounter this site when exploring the framework for the first time. The immediate reaction should be: "this is fast and well-built."

### Brand Personality
**Precise, confident, lightweight.** A focused SSR framework — everything you need, nothing you don't. Feels like a well-engineered tool: no unnecessary complexity, every detail intentional. The site itself should be proof of what the framework delivers.

### Aesthetic Direction
**Editorial precision** — sits between a high-end technical publication and a refined developer tool. Typography-driven, generous whitespace, asymmetric layouts that break away from the typical "dark mode card grid" developer aesthetic.

- **Reference**: Vercel — clean, fast-feeling, technically sophisticated without being cold. The sense of engineering craft visible in every interaction.
- **Display font**: Instrument Serif (italic, for wordmark and hero headlines)
- **Body font**: DM Sans (clean geometric sans for UI and body text)
- **Colors**: Warm stone palette (not cold grays) with burnt orange accent
- **Theme**: Light/dark mode with smooth toggle, defaulting to system preference
- **Anti-references**: Generic dark-mode dashboards, neon-accent developer tools, card grids with icon+heading+text, glassmorphism, gradient text

### Accessibility
- **Target**: WCAG AAA compliance
- **Contrast**: 7:1 minimum for normal text, 4.5:1 for large text
- **Font sizing**: rem/em only, minimum 16px body text
- **Touch targets**: 44px+ minimum
- **Motion**: Respect `prefers-reduced-motion`, keep animations subtle and purposeful
- **Color**: Never use color as the sole differentiator — pair with icons, text, or patterns
- **Zoom**: Never disable user zoom

### Design Principles
1. **Typography is the design** — Let type scale, weight, and spacing do the heavy lifting. No decorative icons above headings.
2. **Show, don't tell** — The streaming demo should make the concept visceral. Live timers, progressive reveals.
3. **Warm neutrals** — Stone palette with orange accent. No cold grays, no pure black/white.
4. **Purposeful asymmetry** — Break grid monotony with varied layouts. Left-align over center.
5. **Restraint** — Every element earns its place. No redundant cards, no decorative sparklines.
6. **Speed as brand** — The site must feel instant. Every interaction reinforces "fast and well-built." Performance is a design decision.
