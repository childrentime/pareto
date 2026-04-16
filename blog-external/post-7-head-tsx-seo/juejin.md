# head.tsx 就是一个 React 组件：用 loader 数据动态生成 SEO meta

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

[Pareto](https://github.com/childrentime/pareto) 反其道而行。在 Pareto 里，`head.tsx` 是一个返回 JSX 的 React 组件：

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

本文讲清楚为什么这个设计更好，以及它在动态 SEO 上能解锁什么。

## 为什么组件比配置好

三个理由。

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
    </>
  )
}
```

循环、守卫、条件渲染 —— React 本来就做的事情。

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

## 路由树决定谁胜出

Head 组件从根渲染到页面。每一层贡献自己的标签。当两层渲染同一个标签（比如两个 `<title>`），浏览器用最后一个——最深路由的自动胜出。

```
app/
  head.tsx                  ← 站点默认
  blog/
    [slug]/
      head.tsx              ← 单篇博文覆盖
```

根层设默认。叶子路由覆盖。这就是你思考 SEO 的方式——大部分标签全站通用，单页加自己的特定项。

```tsx
// app/head.tsx —— 站点默认
export default function Head() {
  return (
    <>
      <title>My App</title>
      <meta name="description" content="The best app for doing things." />
      <link rel="icon" href="/favicon.ico" />
      <meta property="og:site_name" content="My App" />
    </>
  )
}
```

```tsx
// app/blog/[slug]/head.tsx —— 单篇博文覆盖
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData }: HeadProps) {
  const { post } = loaderData as { post: BlogPost }
  return (
    <>
      <title>{post.title} — My App</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:image" content={post.coverImage} />
      <link rel="canonical" href={`https://myapp.com/blog/${post.slug}`} />
    </>
  )
}
```

## HeadProps：带类型的 loader 数据

每个 head 组件收两个 prop：

```tsx
interface HeadProps {
  loaderData: unknown
  params: Record<string, string>
}
```

`loaderData` 是这个路由 loader 返回的东西。它被声明为 `unknown`——转成你的实际类型就行。

这就是让动态 SEO 水到渠成的关键。Loader 拉到了 post。Head 组件收到完全相同的数据。没有单独的 `generateMetadata` 调用去重新拉 post。数据流是：loader → page + head，两者用同一个结果渲染。

## 完整的动态 SEO 示例

给商品目录做实打实的每页 SEO 长这样。

```tsx
// app/products/[id]/head.tsx
import type { HeadProps } from '@paretojs/core'

export default function Head({ loaderData }: HeadProps) {
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

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={product.name} />
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

## 简短版本

Pareto 的 head 系统是架在 React 19 特性之上的一个约定：

- `head.tsx` 是一个返回 JSX 的 React 组件
- React 19 自动把 `<title>`、`<meta>`、`<link>` 吊到 `<head>`
- Head 组件把 `loaderData` 和 `params` 作为 props 收到
- 树从根渲染到页面，某种标签的最后一个胜出

没有独立的 metadata API 要学。你会 React，就会写 meta。任何动态场景，模式都一样：loader 返回数据，head.tsx 用它渲染 JSX，React 19 吊标签。SEO 搞定。

```bash
npx create-pareto@latest my-app
cd my-app && npm install && npm run dev
```

---

*[Pareto](https://github.com/childrentime/pareto) 是一个基于 Vite 的轻量流式优先 React SSR 框架。[文档](https://paretojs.tech)*
