import { Link, useLoaderData } from '@paretojs/core'
import type { LoaderContext, RouteConfig } from '@paretojs/core'

export const config: RouteConfig = { render: 'static' }

interface Post {
  slug: string
  title: string
  content: string
  date: string
  tags: string[]
}

const POSTS: Record<string, Post> = {
  'streaming-ssr': {
    slug: 'streaming-ssr',
    title: 'How Streaming SSR Works',
    date: '2026-03-20',
    tags: ['SSR', 'React 18', 'Streaming'],
    content: `React 18 introduced renderToPipeableStream, which sends the HTML shell to the browser immediately — before all data is ready.

When you use defer() in a loader, resolved values go into the shell. Unresolved promises stream in later as <script> tags that update the DOM. The <Await> component wraps each deferred value with a Suspense boundary, showing a fallback until the data arrives.

This means the user sees the page layout instantly, while slower data (analytics, recommendations, activity feeds) fills in progressively. No full-page spinners, no waiting for the slowest query.`,
  },
  'file-based-routing': {
    slug: 'file-based-routing',
    title: 'File-Based Routing in Pareto',
    date: '2026-03-18',
    tags: ['Routing', 'Conventions', 'DX'],
    content: `Pareto scans your app/ directory and builds routes from convention files:

• page.tsx — the page component, creates a URL route
• layout.tsx — wraps child routes, collected from root down
• error.tsx — catches loader and render errors
• head.tsx — per-route title and meta tags, merged from parents
• loader.ts — server-side data fetching
• route.ts — API endpoints (no HTML, just JSON)
• not-found.tsx — custom 404 page

Dynamic segments use [brackets]: app/blog/[slug]/page.tsx matches /blog/anything. Catch-all segments use [...spread]: app/docs/[...path]/page.tsx matches /docs/a/b/c.`,
  },
  'state-management': {
    slug: 'state-management',
    title: 'Stores with Immer',
    date: '2026-03-15',
    tags: ['State', 'Immer', 'Store'],
    content: `Pareto ships two store APIs built on Immer:

defineStore — global reactive store. Define once, destructure in any component. Updates use Immer drafts so you mutate directly without spreading.

defineContextStore — React Context-scoped store. Accepts initialization data via a Provider, making it perfect for SSR: the loader fetches data on the server, the Provider injects it, and the store manages both server and client state in one place.

Both stores use useSyncExternalStore under the hood, which means they work correctly with React 18 concurrent features and SSR hydration.`,
  },
}

export async function staticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }))
}

export function loader({ params }: LoaderContext) {
  const post = POSTS[params.slug]
  if (!post) {
    const { notFound } = require('@paretojs/core')
    throw notFound()
  }
  return { post }
}

export default function BlogPost() {
  const { post } = useLoaderData<{ post: Post }>()

  return (
    <article>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[0.6875rem] text-stone-400 dark:text-stone-500 tabular-nums">
            {post.date}
          </span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
          {post.title}
        </h2>
      </div>

      <div className="prose prose-stone dark:prose-invert max-w-none">
        {post.content.split('\n\n').map((para, i) => (
          <p
            key={i}
            className="text-[0.9375rem] text-stone-600 dark:text-stone-300 leading-relaxed mb-5"
          >
            {para}
          </p>
        ))}
      </div>

      <div className="h-px bg-stone-200 dark:bg-stone-800 my-8 transition-colors duration-300" />

      <Link
        href="/blog"
        className="inline-flex items-center text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 transition-colors group"
      >
        <svg
          className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        All posts
      </Link>
    </article>
  )
}
