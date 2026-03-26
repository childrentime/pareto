import { Link } from '@paretojs/core'

export default function RedirectDemoPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
      <div className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors mb-6"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4">
          Redirect & 404
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Use <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">redirect()</code> and{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">notFound()</code> in
          loaders to control navigation flow.
        </p>
      </div>

      {/* Demo links */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          Try It
        </h2>
        <div className="space-y-3">
          <DemoCard
            href="/redirect-demo/protected"
            title="Redirect in Loader"
            desc="This page's loader calls redirect('/redirect-demo/target'). You'll land on the target page."
            badge="302"
          />
          <DemoCard
            href="/this-page-does-not-exist"
            title="404 Not Found"
            desc="Navigate to a URL that doesn't match any route. Renders not-found.tsx with 404 status."
            badge="404"
          />
        </div>
      </section>

      {/* Code */}
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
            <span className="text-xs text-stone-500 ml-2">redirect + notFound</span>
          </div>
          <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
            <code className="text-stone-300">
              {'import { '}
              <span className="text-orange-400">redirect</span>
              {', '}
              <span className="text-orange-400">notFound</span>
              {" } from '@paretojs/core'\n\n"}
              <span className="text-stone-500">{'// Redirect: auth guard pattern\n'}</span>
              {'export function loader({ req }) {\n'}
              {'  if (!req.cookies.token)\n'}
              {'    throw '}
              <span className="text-orange-400">redirect</span>
              {"('/login')\n"}
              {'  return { user }\n'}
              {'}\n\n'}
              <span className="text-stone-500">{'// 404: throw notFound() in loader\n'}</span>
              {'export function loader({ params }) {\n'}
              {'  const post = await db.find(params.id)\n'}
              {'  if (!post) throw '}
              <span className="text-orange-400">notFound</span>
              {'()\n'}
              {'  return { post }\n'}
              {'}'}
            </code>
          </pre>
        </div>
      </section>
    </div>
  )
}

function DemoCard({
  href,
  title,
  desc,
  badge,
}: {
  href: string
  title: string
  desc: string
  badge: string
}) {
  return (
    <Link
      href={href}
      className="block py-4 px-5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-800 transition-colors group"
    >
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-base font-semibold text-stone-900 dark:text-stone-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
          {title}
        </span>
        <span className="text-[0.6875rem] leading-none px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-mono">
          {badge}
        </span>
      </div>
      <p className="text-sm text-stone-500 dark:text-stone-400">{desc}</p>
    </Link>
  )
}
