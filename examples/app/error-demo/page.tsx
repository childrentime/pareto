import { useEffect, useState } from 'react'
import { Link, useLoaderData, ParetoErrorBoundary } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export function loader(ctx: LoaderContext) {
  const shouldFail = ctx.req.query.fail === '1'
  if (shouldFail) {
    throw new Error('Intentional loader error for demo')
  }
  return { message: 'Loader ran successfully!', timestamp: new Date().toISOString() }
}

function BrokenComponent(): React.ReactNode {
  throw new Error('Intentional render error for demo')
}

function ErrorFallback({ error }: { error: Error }) {
  useEffect(() => {
    // Report to your monitoring service:
    // Sentry.captureException(error)
    console.error('[app] Caught error:', error.message)
  }, [error])

  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 transition-colors">
      <h3 className="text-red-900 dark:text-red-400 font-semibold mb-1">
        Something went wrong
      </h3>
      <p className="text-red-700/80 dark:text-red-300/60 text-sm mb-4">
        {error.message}
      </p>
      <Link
        href="/"
        className="inline-flex items-center h-8 px-4 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  )
}

export default function ErrorDemoPage() {
  const data = useLoaderData<{ message: string; timestamp: string }>()
  const [showBroken, setShowBroken] = useState(false)

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
          Error Handling
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Use{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
            ParetoErrorBoundary
          </code>
          {' '}to catch render errors locally. Wrap any section of your UI — only
          the broken part shows the fallback, the rest keeps working.
        </p>
      </div>

      {/* Success state */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          Current State
        </h2>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 p-6 transition-colors">
          <p className="text-emerald-800 dark:text-emerald-300 font-medium">{data.message}</p>
          <p className="text-emerald-600/70 dark:text-emerald-400/60 text-sm mt-1">Loaded at: {data.timestamp}</p>
        </div>
      </section>

      {/* Trigger buttons */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          Trigger Errors
        </h2>
        <div className="space-y-6">
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-sm mb-3">
              <strong className="text-stone-600 dark:text-stone-300">Server error:</strong>{' '}
              Loader throws on the server. The framework returns a 500 page.
            </p>
            <a
              href="/error-demo?fail=1"
              className="inline-flex items-center h-10 px-5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Loader Error
            </a>
          </div>
          <div>
            <p className="text-stone-400 dark:text-stone-500 text-sm mb-3">
              <strong className="text-stone-600 dark:text-stone-300">Client error (local boundary):</strong>{' '}
              Component throws during render. Only this section shows the error — the rest of
              the page keeps working.
            </p>
            <ParetoErrorBoundary fallback={ErrorFallback}>
              {showBroken && <BrokenComponent />}
              <button
                onClick={() => setShowBroken(true)}
                className="inline-flex items-center h-10 px-5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                Render Error
              </button>
            </ParetoErrorBoundary>
          </div>
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
            <span className="text-xs text-stone-500 ml-2">page.tsx</span>
          </div>
          <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
            <code className="text-stone-300">
              {'import { '}
              <span className="text-orange-400">ParetoErrorBoundary</span>
              {" } from '@paretojs/core'\n\n"}
              <span className="text-stone-500">{'// Error fallback with monitoring\n'}</span>
              {'function ErrorFallback({ '}
              <span className="text-orange-400">error</span>
              {' }) {\n'}
              {'  useEffect(() => {\n'}
              {'    Sentry.'}
              <span className="text-orange-400">captureException</span>
              {'(error)\n'}
              {'  }, [error])\n'}
              {'  return <p>{error.message}</p>\n'}
              {'}\n\n'}
              <span className="text-stone-500">{'// Wrap risky sections — only the broken part\n'}</span>
              <span className="text-stone-500">{'// shows the fallback, rest keeps working\n'}</span>
              {'<'}
              <span className="text-orange-400">ParetoErrorBoundary</span>
              {' fallback={ErrorFallback}>\n'}
              {'  <RiskyWidget />\n'}
              {'</'}
              <span className="text-orange-400">ParetoErrorBoundary</span>
              {'>'}
            </code>
          </pre>
        </div>
      </section>
    </div>
  )
}
