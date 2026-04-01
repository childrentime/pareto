## Publishing

- **Always use `pnpm publish`**, never `npm publish`. This repo uses pnpm's `catalog:` protocol in peerDependencies — `npm publish` ships the raw `catalog:` string, which breaks installs for users.
- Add `--registry https://registry.npmjs.org` since the local `.npmrc` points to npmmirror.
- For `create-pareto`, run `pnpm templates` before publishing to regenerate templates with resolved `workspace:*` and `catalog:` versions.
- Full command: `pnpm publish --access public --no-git-checks --registry https://registry.npmjs.org`

## External Blog Posts

- Blog posts for external platforms (掘金, Medium, dev.to) live in `blog-external/`.
- Naming convention: `{topic}-{platform}.md` (e.g. `benchmarks-devto.md`, `benchmarks-juejin.md`).
- dev.to posts include frontmatter (`published`, `tags`, `canonical_url`). Medium and 掘金 are plain markdown.
- Always set `canonical_url` to the paretojs.tech blog post to avoid SEO duplication.
- **dev.to**: API key in `.env` as `DEV_TO_API_KEY`. Publish via `curl -X POST https://dev.to/api/articles` with `api-key` header.
- **Medium**: Use the `/medium-push` skill — reads markdown file and pushes to Medium editor via Chrome extension bridge.
- **掘金**: Manual copy-paste from the `*-juejin.md` file.

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
