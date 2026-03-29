import { Link } from '@paretojs/core'

const posts = [
  {
    slug: 'streaming-ssr',
    title: 'How Streaming SSR Works',
    excerpt:
      'React 18 renderToPipeableStream sends the HTML shell immediately, then streams deferred data as promises resolve.',
    date: '2026-03-20',
  },
  {
    slug: 'file-based-routing',
    title: 'File-Based Routing in Pareto',
    excerpt:
      'page.tsx, layout.tsx, error.tsx, head.tsx — convention files that map your directory structure to URL routes.',
    date: '2026-03-18',
  },
  {
    slug: 'state-management',
    title: 'Stores with Immer',
    excerpt:
      'defineStore and defineContextStore give you reactive state with immutable updates — no boilerplate.',
    date: '2026-03-15',
  },
]

export function loader() {
  return { posts }
}

export default function BlogIndex() {
  return (
    <div className="space-y-4">
      {posts.map(post => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="block py-5 px-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors duration-200"
        >
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {post.title}
            </h2>
            <span className="text-[0.6875rem] text-stone-400 dark:text-stone-500 tabular-nums shrink-0">
              {post.date}
            </span>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            {post.excerpt}
          </p>
        </Link>
      ))}

      <div className="h-px bg-stone-200 dark:bg-stone-800 my-8 transition-colors duration-300" />

      <SourceCode />
    </div>
  )
}

function SourceCode() {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
        Source
      </h2>
      <div className="rounded-xl bg-stone-900 dark:bg-stone-900/80 border border-stone-800 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
          </div>
          <span className="text-xs text-stone-500 ml-2">
            app/blog/[slug]/page.tsx
          </span>
        </div>
        <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
          <code className="text-stone-300">
            <span className="text-stone-500">
              {'// 1. Dynamic loader with [slug] param\n'}
            </span>
            {'export function '}
            <span className="text-orange-400">loader</span>
            {'({ params }) {\n'}
            {'  return db.getPost(params.slug)\n'}
            {'}\n\n'}
            <span className="text-stone-500">
              {'// 2. Nested layout wraps all /blog/* pages\n'}
            </span>
            <span className="text-stone-500">
              {'// app/blog/layout.tsx → shared header\n'}
            </span>
            <span className="text-stone-500">
              {'// app/blog/[slug]/page.tsx → this page\n'}
            </span>
          </code>
        </pre>
      </div>
    </section>
  )
}
