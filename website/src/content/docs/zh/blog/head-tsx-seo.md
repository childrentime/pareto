---
title: "head.tsx 就是一个 React 组件：用 loader 数据动态生成 SEO meta"
description: 大多数 SSR 框架把 meta 当成配置对象来处理。Pareto 把它当成 React 组件——结果证明，对于动态的每页 SEO、Open Graph、Twitter 卡片，这个设计要好得多。
template: splash
---

<p class="blog-meta">作者：<a href="https://github.com/childrentime">childrentime</a> · 2026 年 4 月 16 日</p>

看看大部分框架怎么处理 `<head>`：

```tsx
// Next.js
export const metadata = {
  title: 'Blog Post',
  description: '...',
  openGraph: { title: '...', images: [...] },
}

// Remix
export const meta: MetaFunction = ({ data }) => [
  { title: 'Blog Post' },
  { name: 'description', content: '...' },
  { property: 'og:image', content: data.post.coverImage },
]
```

元数据是配置对象。你把字符串和键值对塞进框架规定的 schema，框架再把它们转成 HTML 标签。

Pareto 反其道而行。在 Pareto 里，`head.tsx` 是一个返回 JSX 的 React 组件：

```tsx
// app/head.tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="My awesome app." />
    </>
  )
}
```

就这样。没有要学的 config schema，没有特殊的 `MetaDescriptor` 类型。你写 `<title>` 和 `<meta>`，React 19 自动把它们吊到文档 `<head>` 里。

本文讲清楚为什么这个设计更好，以及它在动态 SEO（也就是 meta 依赖服务端数据）上能解锁什么。

## 为什么组件比配置好

三个理由，按重要性排。

### 1. 你拿到了 JSX —— 包括表达式、循环、条件

配置对象是静态数据。如果你想"只在用户是高级账号时加这条 meta"，你要么在 return 前命令式地构造对象，要么把条件逻辑塞进值里。

组件是代码。条件按正常方式写：

```tsx
export default function Head({ loaderData }: HeadProps) {
  const data = loaderData as LoaderData
  return (
    <>
      <title>{data.product.name}</title>
      <meta name="description" content={data.product.tagline} />

      {data.product.coverImage && (
        <meta property="og:image" content={data.product.coverImage} />
      )}

      {data.product.keywords.map((kw) => (
        <meta property="article:tag" content={kw} key={kw} />
      ))}

      {data.product.isPaid && (
        <meta property="og:restricted" content="paywall" />
      )}
    </>
  )
}
```

循环、守卫、条件渲染 —— React 本来就做的事情。没有 `metadataProvider`，没有要记的 `generateMetadata` 签名。就是 JSX。

### 2. Head 组件和你应用的其他部分一样能组合

想把共享的 OG 标签抽成 helper？它就是个 React 组件：

```tsx
function OpenGraphTags({ title, description, image }: OGProps) {
  return (
    <>
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="article" />
    </>
  )
}

export default function Head({ loaderData }: HeadProps) {
  const { post } = loaderData as { post: Post }
  return (
    <>
      <title>{post.title} — My Blog</title>
      <meta name="description" content={post.excerpt} />
      <OpenGraphTags
        title={post.title}
        description={post.excerpt}
        image={post.coverImage}
      />
    </>
  )
}
```

在配置对象的世界里，这是一个返回数组、然后 spread 到另一个数组里的 helper 函数。在这里，它是组件。读树就能看到 `<head>` 里最终会有什么 HTML。

### 3. React 19 帮你做了 hoisting

这才是让整个方案成立的关键特性。在 React 19 里，你在树里任何地方渲染的 `<title>`、`<meta>`、`<link>`，都会被吊到文档 `<head>` 里——SSR 和客户端导航都一样。没有框架特定的 `MetaProvider` 在收集和序列化元数据。这是 React 平台级特性。

Pareto 没实现 hoisting，React 实现的。Pareto 只决定你的 `head.tsx` 组件在树里**放哪**（在根和页面之间），这样 hoisting 有东西可以拾取。

实际推论：`<title>` 你其实可以在任何组件里写，不限于 `head.tsx`。它就是普通 JSX 标签。`head.tsx` 只是约定——"属于某个路由的那些标签放这"。

## 路由树决定谁胜出

Head 组件从根渲染到页面。每一层贡献自己的标签。当两层渲染同一个标签（比如两个 `<title>`），浏览器用最后一个——最深路由的自动胜出。

```
app/
  head.tsx                  ← 站点默认
  blog/
    head.tsx                ← /blog 区域覆盖
    [slug]/
      head.tsx              ← 单篇博文覆盖
```

根层设默认。区域层覆盖。叶子路由再覆盖。这就是你思考 SEO 的方式——大部分标签全站通用，某个区域稍有差异，单页加自己的特定项。

```tsx
// app/head.tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="The best app for doing things." />
      <link rel="icon" href="/favicon.ico" />
      <meta property="og:site_name" content="My App" />
      <meta name="twitter:card" content="summary_large_image" />
    </>
  )
}
```

```tsx
// app/blog/head.tsx —— 覆盖 /blog 的 title 和 description
export default function Head() {
  return (
    <>
      <title>Blog — My App</title>
      <meta name="description" content="技术博文、发布公告、教程。" />
    </>
  )
}
```

```tsx
// app/blog/[slug]/head.tsx —— 单篇博文覆盖一切
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData }: HeadProps) {
  const { post } = loaderData as { post: BlogPost }
  return (
    <>
      <title>{post.title} — My App</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={post.coverImage} />
      <meta property="article:published_time" content={post.publishedAt} />
      <meta property="article:author" content={post.author.name} />
      <link rel="canonical" href={`https://myapp.com/blog/${post.slug}`} />
    </>
  )
}
```

`/blog/hello-world` 最终的 `<head>` 合并了三层：根层的 favicon 和 twitter 默认、区域层的 description 默认（被 post 覆盖）、post 层的 title、以及 post head.tsx 里所有 OG 相关的标签。

同一个模式，只不过是组件树。没有 `metadataMerge` 函数，没有要学的深合并语义。

## HeadProps：带类型的 loader 数据

每个 head 组件收两个 prop：

```tsx
interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

`loaderData` 是这个路由 loader 返回的东西。它被声明为 `unknown`——head.tsx 在运行时没法知道你的 loader schema，转成你的实际类型就行：

```tsx
export default function Head({ loaderData, params }: HeadProps) {
  const { post } = loaderData as { post: BlogPost }
  // params.slug —— 路由里任何动态段都在这
  return <title>{post.title}</title>
}
```

这就是让动态 SEO 水到渠成的关键。Loader 拉到了 post。Head 组件收到完全相同的数据。`<meta property="og:title" content={post.title} />` 用的是同一个对象。

没有单独的 `generateMetadata` 调用去重新拉 post。数据流是：loader → page + head，两者用同一个结果渲染。

## 完整的动态 SEO 示例

给商品目录做实打实的每页 SEO 长这样。

```ts
// app/products/[id]/loader.ts
import type { LoaderContext } from '@paretojs/core'

export async function loader(ctx: LoaderContext) {
  const product = await db.product.findUnique({
    where: { id: ctx.params.id },
    include: { images: true, category: true },
  })

  if (!product) {
    throw new Response('Not found', { status: 404 })
  }

  return { product }
}
```

```tsx
// app/products/[id]/head.tsx
import type { HeadProps } from '@paretojs/core'

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  images: { url: string }[]
  category: { name: string }
  inStock: boolean
}

export default function Head({ loaderData, params }: HeadProps) {
  const { product } = loaderData as { product: Product }
  const canonicalUrl = `https://shop.example.com/products/${product.id}`
  const primaryImage = product.images[0]?.url ?? '/default-og.png'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  }

  return (
    <>
      <title>{`${product.name} — Our Shop`}</title>
      <meta name="description" content={product.description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="product" />
      <meta property="og:title" content={product.name} />
      <meta property="og:description" content={product.description} />
      <meta property="og:image" content={primaryImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="product:price:amount" content={String(product.price)} />
      <meta property="product:price:currency" content={product.currency} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={product.name} />
      <meta name="twitter:description" content={product.description} />
      <meta name="twitter:image" content={primaryImage} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
```

一个文件。动态 title、完整 Open Graph、Twitter 卡片、canonical URL、JSON-LD 结构化数据——全部来自页面组件同样要用的那个 `product` 对象。没有重复拉取，没有单独的 metadata API。

## 必须在 paint 前执行的内联脚本

偶尔你需要脚本在页面 paint 前执行——经典例子是根据 `localStorage` 在 `<html>` 上打 dark-mode class，这样用户看不到闪一下错误主题。

head.tsx 里支持内联脚本：

```tsx
export default function Head() {
  return (
    <>
      <title>My App</title>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
                document.documentElement.classList.add('dark')
            } catch(e) {}
          })()`,
        }}
      />
    </>
  )
}
```

一个注意点：客户端导航时 React 19 会吊 `<title>`、`<meta>`、`<link>`，但**不会**吊 `<script>`。对只需要在页面加载时跑一次的初始化脚本来说，这没问题。如果你的脚本需要每次导航都重跑，放到普通组件里去。

## 如果数据不是在 loader 里拉的呢？

Head 组件只能访问 loader 数据。如果你需要 loader 没返回的东西，答案是：让 loader 返回它。

这是特性，不是限制。Head 元数据是页面数据形状的一部分。在 head 组件里单独拉取会把 DB 查询翻倍。让页面需要的东西从一个 loader 里全部返回——page 用它渲染，head 用它渲染，一次往返。

如果某些元数据计算昂贵但页面不需要，也可以在 loader 里拉了、page 里不用：

```ts
export async function loader(ctx: LoaderContext) {
  const [post, seoTags] = await Promise.all([
    getPost(ctx.params.slug),
    generateSeoTagsForPost(ctx.params.slug),
  ])
  return { post, seoTags }
}
```

两个查询并行跑。Head 用 `seoTags`，page 忽略它。

## 简短版本

Pareto 的 head 系统是架在 React 19 特性之上的一个约定：

- `head.tsx` 是一个返回 JSX 的 React 组件
- React 19 自动把 `<title>`、`<meta>`、`<link>` 吊到 `<head>`
- Head 组件把 `loaderData` 和 `params` 作为 props 收到
- 树从根渲染到页面，某种标签的最后一个胜出

没有独立的 metadata API 要学。你会 React，就会写 meta。你懂嵌套路由里布局怎么覆盖，就懂 head 标签怎么合并。

任何动态场景——博文、商品页、用户主页、搜索结果——模式都一样：loader 返回数据，head.tsx 用它渲染 JSX，React 19 吊标签。SEO 搞定。

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

相关阅读：
- [Head 管理文档](/zh/concepts/head-management/) —— 约定完整参考
- [动态路由](/zh/blog/dynamic-routes/) —— `head.tsx` 在路由树里该放哪
- [流式 SSR](/zh/blog/streaming-ssr/) —— loader 数据怎么流到页面

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
