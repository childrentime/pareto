import { Link, useLoaderData } from '@paretojs/core'
import type { LoaderContext, RouteConfig } from '@paretojs/core'

export const config: RouteConfig = { render: 'static' }

interface HomeData {
  version: string
  features: { title: string; desc: string; href?: string; external?: boolean }[]
}

export function loader(_ctx: LoaderContext) {
  return {
    version: '3.0.0',
    features: [
      {
        title: 'SSR & Streaming',
        desc: 'Server-render pages instantly. Use defer() to stream slow data through Suspense boundaries — no full-page spinners.',
        href: '/stream',
      },
      {
        title: 'State Management',
        desc: 'Reactive stores powered by Immer. Define once, destructure anywhere — serialized across server and client.',
        href: '/store',
      },
      {
        title: 'SSR + Store',
        desc: 'Initialize stores with server-loaded data via defineContextStore. SSR catalog with client-side cart state.',
        href: '/ssr-store',
      },
      {
        title: 'Dynamic Routes & SSG',
        desc: '[slug] params, nested layouts, and staticParams() for static generation at build time.',
        href: '/blog',
      },
      {
        title: 'Error Boundaries',
        desc: 'ParetoErrorBoundary catches render errors locally. Wrap any section — only the broken part shows the fallback.',
        href: '/error-demo',
      },
      {
        title: 'Redirect & 404',
        desc: 'throw redirect("/login") in loaders. throw notFound() renders not-found.tsx with 404 status.',
        href: '/redirect-demo',
      },
      {
        title: 'Resource Routes',
        desc: 'API endpoints via route.ts — no component, just loader. Returns JSON directly.',
        href: '/api/time',
        external: true,
      },
      {
        title: 'Head Management',
        desc: 'Per-route <title> and meta tags via head.tsx. Nested layouts merge heads automatically.',
        href: '/head-demo',
      },
    ],
  } satisfies HomeData
}

export default function IndexPage() {
  const data = useLoaderData<HomeData>()

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8">
      {/* Hero */}
      <section className="pt-20 pb-16 lg:pt-28 lg:pb-20">
        <p className="text-[0.8125rem] font-semibold tracking-wider uppercase text-orange-700 dark:text-orange-500 mb-5">
          v{data.version}
        </p>
        <h1 className="text-[clamp(2.75rem,6vw,4.75rem)] leading-[0.95] font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-7">
          Lightweight
          <br />
          React SSR
        </h1>
        <p className="text-lg leading-relaxed text-stone-500 dark:text-stone-400 max-w-xl mb-10">
          SSR, streaming, file-based routing, state management&mdash;everything
          you need to build fast React apps, nothing you don&apos;t.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <a
            href="https://github.com/childrentime/pareto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center h-11 px-6 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-semibold hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors"
          >
            Get Started
          </a>
          <Link
            href="/stream"
            className="inline-flex items-center h-11 px-1 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group"
          >
            See it stream
            <svg
              className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      <div className="h-px bg-stone-200 dark:bg-stone-800 transition-colors duration-300" />

      {/* Features */}
      <section className="py-16 lg:py-24">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-10">
          Features
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
          {data.features.map((f, i) => (
            <div key={f.title}>
              <span className="text-3xl font-light text-orange-600/25 dark:text-orange-500/15 select-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mt-1 mb-2">
                {f.title}
              </h3>
              <p className="text-[0.875rem] text-stone-500 dark:text-stone-400 leading-relaxed mb-2">
                {f.desc}
              </p>
              {f.href && (
                f.external ? (
                  <a
                    href={f.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 transition-colors group"
                  >
                    Demo
                    <svg
                      className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                ) : (
                  <Link
                    href={f.href}
                    className="inline-flex items-center text-sm font-medium text-orange-700 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 transition-colors group"
                  >
                    Demo
                    <svg
                      className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="h-px bg-stone-200 dark:bg-stone-800 transition-colors duration-300" />

      {/* Code example */}
      <section className="py-16 lg:py-24">
        <div className="grid lg:grid-cols-[1fr,1.2fr] gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 mb-4">
              Feels familiar.
            </h2>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              If you&apos;ve used Next.js or Remix, you already know how. Export
              a loader, return deferred data, wrap promises in
              Await&mdash;streaming happens automatically.
            </p>
          </div>
          <CodeBlock />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-stone-200 dark:border-stone-800 transition-colors duration-300">
        <p className="text-sm text-stone-400 dark:text-stone-600">
          Pareto&mdash;Lightweight React SSR
        </p>
      </footer>
    </div>
  )
}

function CodeBlock() {
  return (
    <div className="rounded-xl bg-stone-900 dark:bg-stone-900/80 border border-stone-800 overflow-hidden transition-colors duration-300">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
        </div>
        <span className="text-xs text-stone-500 ml-2">
          app/dashboard/page.tsx
        </span>
      </div>
      <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
        <code className="text-stone-300">
          <span className="text-stone-500">
            {'// Data loads in parallel on the server\n'}
          </span>
          {'export async function '}
          <span className="text-orange-400">loader</span>
          {'() {\n'}
          {'  const stats = await db.getStats()\n\n'}
          {'  return '}
          <span className="text-orange-400">defer</span>
          {'({\n'}
          {'    stats,\n'}
          {'    feed: db.getFeed(),       '}
          <span className="text-stone-500">{'// streams later'}</span>
          {'\n'}
          {'    comments: db.getComments() '}
          <span className="text-stone-500">{'// streams later'}</span>
          {'\n'}
          {'  })\n'}
          {'}\n\n'}
          {'export default function Page() {\n'}
          {'  const data = '}
          <span className="text-orange-400">useLoaderData</span>
          {'()\n'}
          {'  return (\n'}
          {'    <'}
          <span className="text-orange-400">Await</span>
          {' resolve={data.feed}\n'}
          {'      fallback={<Skeleton />}>\n'}
          {'      {(feed) => <Feed items={feed} />}\n'}
          {'    </Await>\n'}
          {'  )\n'}
          {'}'}
        </code>
      </pre>
    </div>
  )
}
