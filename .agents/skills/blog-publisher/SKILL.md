---
name: blog-publisher
description: >
  Write blog posts for the Pareto documentation site and create external platform versions
  for 掘金 (Juejin), Medium, and Dev.to. Handles bilingual content (English + Chinese),
  updates the blog listing pages, verifies internal links, and builds to confirm.
  Use when the user says "write a blog post", "发布文章", "写博客", "new blog post",
  "publish article", "blog about X", or wants to announce a feature/release.
  Also use when the user asks to prepare content for external platforms like Juejin, Medium, or Dev.to.
---

# Blog Publisher

Write blog posts for the Pareto website and prepare versions for external publishing platforms.

## Context

The Pareto documentation site uses Astro + Starlight. Blog posts live in the docs content collection
but use `template: splash` to render without the documentation sidebar. The site is bilingual
(English + Chinese). External platform versions strip internal links and add canonical URLs.

## File Locations

```
website/src/content/docs/blog/          # English blog posts
website/src/content/docs/blog/index.mdx # English blog listing
website/src/content/docs/zh/blog/       # Chinese blog posts
website/src/content/docs/zh/blog/index.mdx # Chinese blog listing
blog-external/                           # External platform versions
```

## Workflow

### 1. Write the blog post

Create the English version first at `website/src/content/docs/blog/<slug>.md`:

```markdown
---
title: Post Title
description: One-line description for SEO and social sharing.
template: splash
---

Post content here...
```

Key points:
- Always use `template: splash` — this removes the docs sidebar from blog pages
- Write in the Pareto brand voice: precise, confident, technical but approachable
- Include code examples inline — they make the content more concrete and AI-citable
- Use tables for feature comparisons and convention file listings
- End with a clear call-to-action (try it, install it, read more)

### 2. Write the Chinese translation

Create at `website/src/content/docs/zh/blog/<slug>.md` with the same frontmatter structure.
Translate naturally — don't transliterate. Technical terms (Vite, React, SSR, loader) stay in English.
Code examples stay identical. Only translate prose and UI strings in code comments.

### 3. Update blog listing pages

Add an entry to BOTH listing pages (`blog/index.mdx` and `zh/blog/index.mdx`).

English entry format:
```html
<article class="blog-entry">

### [Post Title](/blog/<slug>/)

One-line description matching the frontmatter description.

<span class="blog-date">Month Day, Year</span>

</article>
```

Chinese entry format — same structure, translated text, link path prefixed with `/zh/`.

Add new entries at the TOP of the `<div class="blog-list">` block (newest first).

### 4. Create external platform versions

Create two files in `blog-external/`:

**`<slug>-medium-devto.md`** — For Medium and Dev.to:
- Start with `# Title` (H1 heading, no frontmatter)
- Add a TL;DR block at the top (1-2 sentences + install command)
- Replace ALL internal doc links (like `[API reference](/api/core/)`) with full URLs (`https://paretojs.dev/api/core/`)
- End with a **Links** section: GitHub, Docs, Full post URL
- End with a line encouraging GitHub stars

**`<slug>-juejin.md`** — For 掘金:
- Same structure as Medium version but in Chinese
- Technical terms stay in English
- Links section uses Chinese labels (GitHub, 文档, 完整发布说明)

### 5. Verify links

Scan all new and modified `.md`/`.mdx` files for internal links.
For each link like `(/concepts/routing/)`, verify the target file exists:
- `/concepts/routing/` → `website/src/content/docs/concepts/routing.md`
- `/zh/concepts/routing/` → `website/src/content/docs/zh/concepts/routing.md`
- `/blog/<slug>/` → `website/src/content/docs/blog/<slug>.md`

Report any broken links before proceeding.

### 6. Build and verify

Run `npx astro build` in the website directory. The build must complete with no errors.
Check that the page count increased (new blog pages should appear in the build output).

## Writing Guidelines

### Blog post structure

For release announcements:
1. Opening paragraph — what changed and why it matters
2. Major changes — one H2 section per feature, with code examples
3. Migration guide — numbered steps for upgrading
4. Call to action — `npx create-pareto@latest` or link to docs

For technical deep-dives:
1. Problem statement — what pain point this addresses
2. How it works — with progressive code examples
3. When to use / when not to use — practical guidance
4. Related concepts — links to relevant docs

### Code examples

- Always include the file path as a comment: `// app/dashboard/loader.ts`
- Use TypeScript with proper type imports
- Keep examples minimal — show the pattern, not a full app
- For `pareto.config.ts` examples, always include the full file structure with imports and `export default`

### SEO considerations

- Title should include the primary keyword naturally
- Description should be actionable (not just descriptive)
- Include a comparison table if comparing with other tools
- Add links to relevant documentation pages (cross-linking helps SEO)

### External platform differences

Medium/Dev.to readers may not know Pareto. Add 1-2 sentences of context at the top
explaining what Pareto is before diving into what changed.

掘金 readers are familiar with the Chinese frontend ecosystem. You can reference
Next.js, Remix, Vite directly without explanation, but briefly explain what Pareto is.
