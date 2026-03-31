import { Link } from '@paretojs/core'

export default function ErrorPage({ error }: { error: Error }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-6">
      <span className="text-[8rem] leading-none font-bold text-red-100 dark:text-red-950 select-none transition-colors duration-300">
        500
      </span>
      <p className="text-stone-500 dark:text-stone-400 mt-2 mb-8">
        {error.message || 'Something went wrong.'}
      </p>
      <Link
        href="/"
        className="inline-flex items-center h-10 px-5 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}
