---
name: pareto-seo-blog
description: Write a new Pareto blog post targeting a specific long-tail SEO keyword and prepare its three external-platform copies (Medium, dev.to, 掘金). Use when the user says "写一篇博客", "写一篇 SEO 博客", "针对 X 关键词写博客", "新增一篇博客", "create a new pareto blog post", "publish a new blog post", "write SEO content", or names a slug from blog-external/SEO-KEYWORDS.md and asks to draft it. Generates the bilingual website canonical post (EN + ZH), updates both blog index pages, and produces medium.md / devto.md / juejin.md ready to publish through the existing flow (curl for dev.to, /medium-push, manual copy for 掘金).
---

# pareto-seo-blog — Write a Pareto blog post for a target long-tail keyword

This is the project's **single source of truth** for writing new blog posts. It enforces every rule in `CLAUDE.md` (canonical-page-first, sequential numbering, frontmatter shape, bilingual mirror) and adds the SEO layer (target keyword in the right slots, internal-link map, voice match).

## Inputs you need from the user

Ask for any that are missing — but if `SEO-KEYWORDS.md` already lists the slug, just confirm:

1. **Slug** (e.g. `pareto-vs-nextjs`, `react-hydration-mismatch-fix`).
2. **Primary long-tail keyword** (the phrase the post must rank for).
3. **Languages**: usually `both` (EN + ZH); sometimes `en-only` or `zh-only`.
4. **Whether it's a `compare/` page or `blog/` post** — comparison pages live under `website/src/content/docs/compare/{slug}.md` and target evaluator queries; everything else lives under `blog/`.

If the user just says "写下一篇 SEO 博客" without picking, **read `blog-external/SEO-KEYWORDS.md`**, propose the top unwritten Tier-1 entry, and confirm.

---

## Workflow

### Step 1. Confirm slug and resolve post number

```bash
ls blog-external/ | grep '^post-' | sort -V | tail -1
```

Next post number = max + 1. The external folder is `blog-external/post-{N}-{slug}/`.

Verify the slug is **unique**:

```bash
ls website/src/content/docs/blog/{slug}.md website/src/content/docs/zh/blog/{slug}.md 2>&1
```

If either already exists, stop and ask the user whether to overwrite or pick a different slug.

### Step 2. Read the keyword brief and voice anchors

1. Read `blog-external/SEO-KEYWORDS.md` and locate the entry for this slug. If absent, ask the user for primary + secondary keywords and the searcher intent in one sentence, then **append the entry to SEO-KEYWORDS.md** so the doc stays current.

2. Read **two** existing posts to absorb voice. Pick by topic adjacency:
   - State / hooks / runtime → `website/src/content/docs/blog/ssr-state-trap.md`
   - Comparison / migration → `website/src/content/docs/blog/nextjs-migration.md`
   - Performance / streaming → `website/src/content/docs/blog/slowest-api.md`
   - Tutorial / quickstart → `website/src/content/docs/blog/vite-ssr-quickstart.md`

3. Voice anchors (the post must hit these):
   - **Open with a concrete scenario or pain.** Not "In this post, I'll cover…". Show the bug, the DevTools screenshot in prose, the migration meeting where someone asked "why are we still on Next.js".
   - **Confident, terse, technical.** Short sentences. No hedging ("perhaps", "you might want to consider"). State the fact.
   - **Code blocks are real, not pseudocode.** They should compile / typecheck mentally. TypeScript by default.
   - **Make decision rules explicit.** "Use X when Y. Use Z otherwise." End with a one-liner the reader can paste into a code review.
   - **No emojis. No marketing voice.** No "🚀", no "Let's dive in!", no "In conclusion". The closing section is usually titled "The bigger pattern" or similar.
   - **Footer:** `npx create-pareto@latest my-app` block + the standard attribution paragraph.

### Step 3. Write the EN canonical post

Path: `website/src/content/docs/blog/{slug}.md` (or `compare/{slug}.md` for comparisons).

Frontmatter shape (match existing posts exactly — no quotes around `description`):

```markdown
---
title: "{Title with primary keyword near the front}"
description: {150–160 char description leading with the searcher's question/pain. Primary keyword must appear naturally.}
template: splash
---

<p class="blog-meta">By <a href="https://github.com/childrentime">childrentime</a> · {Month D, YYYY}</p>

{Body — see structure below}

<style>
{`
  .blog-meta { font-size: 0.875rem; color: var(--sl-color-gray-3); margin-bottom: 2rem; }
  .blog-meta a { color: var(--sl-color-accent); }
`}
</style>
```

Use today's date from the harness's `currentDate` for the byline.

**Body structure** — adapt to topic but keep this skeleton:

1. **Hook** (2–3 paragraphs): concrete scenario where the reader feels the pain. Primary keyword in the first paragraph.
2. **Why it happens / what's actually going on** — one H2 with the technical root cause.
3. **The Pareto answer** — one or two H2s with code. Compare-page variant: side-by-side feature table here.
4. **The decision rule** or **When to use X vs Y** — a short H2 with bullets.
5. **The bigger pattern** (or similar) — one closing H2 that reframes the topic at one level of abstraction up.
6. **Footer:** install snippet + attribution paragraph.

**SEO requirements** (validate before saving):

- [ ] Primary keyword in `title`, H1, slug, first 100 words of body, `description`.
- [ ] At least 3 secondary keywords from the brief appear in H2s or first sentences of paragraphs.
- [ ] 2–3 internal links to existing Pareto pages. Use the internal-link map at the bottom of `SEO-KEYWORDS.md`. Site-relative paths only (`/blog/foo/`, never `https://paretojs.tech/blog/foo/`).
- [ ] One external authority link (React docs, MDN, a referenced benchmark).
- [ ] One link to `https://github.com/childrentime/pareto`.
- [ ] Word count: 900–1800. Comparison pages can go to 2400.

### Step 4. Write the ZH canonical post

Path: `website/src/content/docs/zh/blog/{slug}.md`.

**Not a literal translation.** Adapt for Chinese readers:

- Title: pick the natural Chinese long-tail (consult SEO-KEYWORDS.md ZH entries). Don't translate the English title word-for-word.
- Idioms: rewrite hooks with scenarios a Chinese dev relates to (掘金 / 知乎 register, not corporate-translation register).
- Code blocks: **identical** to the English version (don't translate identifiers, comments, or string literals — readers copy-paste).
- Byline: `<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · YYYY 年 M 月 D 日</p>`
- Internal links: site-relative, but pointed at `/zh/...` mirrors (`/zh/blog/streaming-ssr/`, `/zh/concepts/routing/`).
- Same `<style>` block at the end.

### Step 5. Update both blog index pages

Insert a new `<article class="blog-entry">` block at the **top** of:

- `website/src/content/docs/blog/index.mdx`
- `website/src/content/docs/zh/blog/index.mdx`

Match the format of existing entries exactly:

```mdx
<article class="blog-entry">

### [{Title}](/blog/{slug}/)

{Description from frontmatter, possibly slightly tightened.}

<span class="blog-date">{Month D, YYYY}</span>

</article>
```

ZH version uses `[标题](/zh/blog/{slug}/)` and `YYYY 年 M 月 D 日`.

For comparison pages under `compare/`, link to `/compare/{slug}/` (and they don't currently appear on the blog index — confirm with the user whether to add an entry, or whether `compare/` deserves its own index page).

### Step 6. Generate the three external copies

Folder: `blog-external/post-{N}-{slug}/`. Create three files:

#### `medium.md`

Plain markdown. **No frontmatter.** Starts with `# {Title}`. Body is the **EN** post minus the frontmatter, the `<p class="blog-meta">` line, and the `<style>` block. Internal site-relative links (`/blog/foo/`) become absolute (`https://paretojs.tech/blog/foo/`) since Medium readers don't have the site context.

#### `devto.md`

YAML frontmatter:

```markdown
---
title: "{Title}"
published: false
description: "{Same description, max 160 chars}"
tags: {pick 4 from: react, javascript, ssr, webdev, nextjs, vite, performance, tutorial, seo}
series:
canonical_url: https://paretojs.tech/blog/{slug}/
cover_image:
---

{Body — same as medium.md body}
```

Tag rules: dev.to allows max 4. Always include `react`. Add `nextjs` for comparison/migration posts, `vite` for build-tool posts, `tutorial` for how-to posts, `seo` for meta-tag/head/SEO topics, `performance` for benchmark/streaming posts.

`canonical_url` MUST point at the website page. **Do not generate the dev.to file before the website page exists** — that's the rule from CLAUDE.md.

#### `juejin.md`

The **ZH** post body, no frontmatter. Starts with `# {Chinese title}`. Site-relative `/zh/blog/foo/` links become absolute `https://paretojs.tech/zh/blog/foo/`.

### Step 7. Print the publish checklist

Output exactly this to the user:

```
✅ Files written:
   - website/src/content/docs/blog/{slug}.md
   - website/src/content/docs/zh/blog/{slug}.md
   - website/src/content/docs/blog/index.mdx (entry added)
   - website/src/content/docs/zh/blog/index.mdx (entry added)
   - blog-external/post-{N}-{slug}/medium.md
   - blog-external/post-{N}-{slug}/devto.md
   - blog-external/post-{N}-{slug}/juejin.md

Next steps to publish:

1. Verify the website canonical renders:
   pnpm --filter website dev   →   open /blog/{slug}/ and /zh/blog/{slug}/

2. Push to dev.to (creates a draft; flip to public in the dashboard):
   set -a; source .env; set +a
   curl -sS -X POST https://dev.to/api/articles \\
     -H "api-key: $DEV_TO_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d @<(python3 -c "...")    # or use the helper from a previous publish

3. Push to Medium (open https://medium.com/new-story first):
   /medium-push blog-external/post-{N}-{slug}/medium.md

4. 掘金: copy blog-external/post-{N}-{slug}/juejin.md content manually into the
   掘金 editor at https://juejin.cn/editor/drafts/new (no API).
```

---

## Voice anti-patterns to refuse

If you catch yourself writing any of these, rewrite before saving:

- "In this post, we'll explore…" → just start with the scenario.
- "Let's dive deep into…" → cut.
- "🚀 / 🎉 / ⚡" → no emojis, ever.
- "It's worth noting that…" → just note it.
- "In conclusion / TL;DR / Summary" → use "The bigger pattern" or similar.
- Long bulleted feature lists with no prose → blog posts are arguments, not changelogs.
- "Pareto is the best framework because…" → marketing voice. Show, don't claim.
- Code blocks without imports / with `// ...` placeholders → write real code.
- "Click [here](...)" → the link text IS the anchor.

## When to refuse the task

- The slug points at a topic that's already well-covered by an existing post and the user can't articulate the new angle. Push back: "We already have `/blog/X/` covering this. What's the unique reason to write another one?"
- The keyword doesn't appear in `SEO-KEYWORDS.md` and the user can't explain searcher intent in one sentence. Push back: SEO without a target reader is busywork.
- The user wants pure listicle / generic content with no Pareto-specific story. Push back: every Pareto post needs a Pareto-only insight, otherwise it's noise.

## File reference (relative to repo root)

| Purpose | Path |
|---|---|
| EN canonical post | `website/src/content/docs/blog/{slug}.md` |
| ZH canonical post | `website/src/content/docs/zh/blog/{slug}.md` |
| EN comparison page | `website/src/content/docs/compare/{slug}.md` |
| EN blog index | `website/src/content/docs/blog/index.mdx` |
| ZH blog index | `website/src/content/docs/zh/blog/index.mdx` |
| External copies | `blog-external/post-{N}-{slug}/{medium,devto,juejin}.md` |
| Keyword brief | `blog-external/SEO-KEYWORDS.md` |
| Project rules | `CLAUDE.md` (Blog Publishing section) |
