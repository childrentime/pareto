---
title: Document Customization
description: Customize <html> element attributes per request using document.tsx.
---

Pareto lets you customize the `<html>` element attributes by creating an `app/document.tsx` file at the root of your app directory. This is useful for setting `lang`, `dir`, theme attributes, or any other HTML attribute based on the current request.

## Basic usage

Create `app/document.tsx` and export a `getDocumentProps` function:

```tsx
// app/document.tsx
import type { GetDocumentProps } from '@paretojs/core'

export const getDocumentProps: GetDocumentProps = ({ pathname }) => {
  const lang = pathname.startsWith('/zh') ? 'zh' : 'en'
  return {
    lang,
    dir: lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr',
  }
}
```

The returned object is spread onto the `<html>` element. Common attributes like `lang`, `dir`, and `className` are typed explicitly for convenience, but you can return any string attribute.

## How it works

- **Server** — `getDocumentProps` runs on every request. The returned attributes are applied to the `<html>` element in the SSR HTML output.
- **Client navigation** — When the user navigates client-side, Pareto re-runs `getDocumentProps` and syncs the attributes onto `document.documentElement`. Stale attributes from the previous page are automatically removed.

This means your `<html>` attributes stay correct across both server-rendered pages and client-side navigations without any manual DOM manipulation.

## DocumentContext

The `getDocumentProps` function receives a `DocumentContext` object:

```tsx
interface DocumentContext {
  req: Request
  params: Record<string, string>
  pathname: string
  loaderData: unknown
}
```

| Property | Description |
|----------|-------------|
| `req` | The Express request object |
| `params` | Dynamic route parameters (e.g. `{ slug: 'hello' }`) |
| `pathname` | The current URL path |
| `loaderData` | Data returned by the route's loader |

You can use any of these to determine what attributes to set. For example, you could read a cookie from `req` to set a theme, or use `loaderData` to set attributes based on fetched content.

## Common patterns

### Internationalization

Set `lang` and `dir` based on the URL or route parameters:

```tsx
export const getDocumentProps: GetDocumentProps = ({ params }) => {
  const lang = params.lang || 'en'
  return {
    lang,
    dir: lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr',
  }
}
```

### Theme support

Apply a theme class or data attribute:

```tsx
export const getDocumentProps: GetDocumentProps = ({ req }) => {
  const theme = req.cookies?.theme || 'light'
  return {
    'data-theme': theme,
    className: theme,
  }
}
```

### Custom data attributes

Pass any data attribute for use by client-side scripts or CSS:

```tsx
export const getDocumentProps: GetDocumentProps = ({ pathname }) => ({
  lang: 'en',
  'data-page': pathname.split('/')[1] || 'home',
})
```

## Return type

`getDocumentProps` returns an `HtmlAttributes` object:

```tsx
type HtmlAttributes = Record<string, string> & {
  lang?: string
  dir?: string
  className?: string
}
```

All keys are applied as attributes on the `<html>` element. The `className` key maps to the HTML `class` attribute.

## Related

- [@paretojs/core API](/api/core/) — Full type reference for `DocumentContext`, `HtmlAttributes`, and `GetDocumentProps`.
- [File-Based Routing](/concepts/routing/) — How `document.tsx` fits into the convention file system.
- [Head Management](/concepts/head-management/) — Per-route `<title>` and meta tags via `head.tsx`.
