import { Link } from '@paretojs/core'

export default function RedirectTargetPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-14 lg:py-20">
      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-8 transition-colors">
        <h1 className="text-emerald-900 dark:text-emerald-300 text-2xl font-semibold mb-2">
          Redirected!
        </h1>
        <p className="text-emerald-700/80 dark:text-emerald-400/60 leading-relaxed mb-6">
          You were redirected here from <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">/redirect-demo/protected</code>.
          The loader called <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">throw redirect(&apos;/redirect-demo/target&apos;)</code> before
          the page component ever rendered.
        </p>
        <Link
          href="/redirect-demo"
          className="inline-flex items-center h-10 px-5 rounded-lg bg-emerald-700 text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          Back to Redirect Demo
        </Link>
      </div>
    </div>
  )
}
