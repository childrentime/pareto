import type { PropsWithChildren } from 'react'
import { Link } from '@paretojs/core'

export default function BlogLayout({ children }: PropsWithChildren) {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-6"
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4">
          Blog
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Dynamic routes with{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
            [slug]
          </code>
          , nested layout, and static generation via{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
            staticParams
          </code>
          .
        </p>
      </div>

      <div className="h-px bg-stone-200 dark:bg-stone-800 mb-10 transition-colors duration-300" />

      {children}
    </div>
  )
}
