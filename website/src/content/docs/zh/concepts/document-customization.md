---
title: 文档定制
description: 使用 document.tsx 按请求自定义 <html> 元素属性。
---

Pareto 允许你通过在 `app/` 根目录创建 `app/document.tsx` 文件来自定义 `<html>` 元素的属性。这对于根据当前请求设置 `lang`、`dir`、主题属性或任何其他 HTML 属性非常有用。

## 基本用法

创建 `app/document.tsx` 并导出 `getDocumentProps` 函数：

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

返回的对象会展开应用到 `<html>` 元素上。常用属性 `lang`、`dir` 和 `className` 有显式类型定义，但你可以返回任何字符串属性。

## 工作原理

- **服务端** — `getDocumentProps` 在每次请求时执行。返回的属性应用到 SSR HTML 输出的 `<html>` 元素上。
- **客户端导航** — 当用户进行客户端导航时，Pareto 重新运行 `getDocumentProps` 并将属性同步到 `document.documentElement`。上一页的过期属性会自动移除。

这意味着你的 `<html>` 属性在服务端渲染页面和客户端导航之间始终保持正确，无需手动操作 DOM。

## DocumentContext

`getDocumentProps` 函数接收一个 `DocumentContext` 对象：

```tsx
interface DocumentContext {
  req: Request
  params: Record<string, string>
  pathname: string
  loaderData: unknown
}
```

| 属性 | 描述 |
|------|------|
| `req` | Express 请求对象 |
| `params` | 动态路由参数（如 `{ slug: 'hello' }`） |
| `pathname` | 当前 URL 路径 |
| `loaderData` | 路由 loader 返回的数据 |

你可以使用这些属性来决定设置哪些属性。例如，从 `req` 中读取 cookie 来设置主题，或使用 `loaderData` 根据获取的内容设置属性。

## 常见模式

### 国际化

根据 URL 或路由参数设置 `lang` 和 `dir`：

```tsx
export const getDocumentProps: GetDocumentProps = ({ params }) => {
  const lang = params.lang || 'en'
  return {
    lang,
    dir: lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr',
  }
}
```

### 主题支持

应用主题 class 或 data 属性：

```tsx
export const getDocumentProps: GetDocumentProps = ({ req }) => {
  const theme = req.cookies?.theme || 'light'
  return {
    'data-theme': theme,
    className: theme,
  }
}
```

### 自定义 data 属性

传递任何 data 属性，供客户端脚本或 CSS 使用：

```tsx
export const getDocumentProps: GetDocumentProps = ({ pathname }) => ({
  lang: 'en',
  'data-page': pathname.split('/')[1] || 'home',
})
```

## 返回类型

`getDocumentProps` 返回 `HtmlAttributes` 对象：

```tsx
type HtmlAttributes = Record<string, string> & {
  lang?: string
  dir?: string
  className?: string
}
```

所有键都会作为 `<html>` 元素的属性应用。`className` 键映射到 HTML 的 `class` 属性。

## 相关文档

- [@paretojs/core API](/zh/api/core/) — `DocumentContext`、`HtmlAttributes` 和 `GetDocumentProps` 的完整类型参考。
- [基于文件的路由](/zh/concepts/routing/) — `document.tsx` 在约定文件系统中的位置。
- [Head 管理](/zh/concepts/head-management/) — 通过 `head.tsx` 为每个路由设置 `<title>` 和 meta 标签。
