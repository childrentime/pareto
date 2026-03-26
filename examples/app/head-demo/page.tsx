import { Link, useLoaderData } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

export function loader(_ctx: LoaderContext) {
  return {
    generatedAt: new Date().toISOString(),
  }
}

export default function HeadDemoPage() {
  const data = useLoaderData<{ generatedAt: string }>()

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
          Head Management
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Each route exports a <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">head()</code> function
          from <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">head.tsx</code> that
          returns title and meta tags. Nested layouts merge heads automatically &mdash; deeper routes override shallower ones.
        </p>
      </div>

      {/* Current head info */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          This Page&apos;s Head
        </h2>
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 divide-y divide-stone-200 dark:divide-stone-800 overflow-hidden">
          <HeadRow label="title" value="Head Management — Pareto" />
          <HeadRow label="meta[description]" value="Per-route title and meta tags via head.tsx with automatic merging." />
          <HeadRow label="meta[og:type]" value="website" />
          <HeadRow label="Generated at" value={data.generatedAt} />
        </div>
      </section>

      {/* Try navigating */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          Try It
        </h2>
        <p className="text-stone-400 dark:text-stone-500 text-sm mb-4">
          Navigate to other pages and check the browser tab title &mdash; each route sets its own title via <code className="text-[0.8125rem] px-1 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">head.tsx</code>.
          On client-side navigation, the title updates without a page reload.
        </p>
        <div className="flex flex-wrap gap-3">
          <NavChip href="/" label="Home" title="Pareto — Lightweight React SSR Framework" />
          <NavChip href="/stream" label="Streaming" title="Streaming SSR — Pareto" />
          <NavChip href="/store" label="Store" title="Store — Pareto" />
          <NavChip href="/error-demo" label="Errors" title="Error Handling — Pareto" />
        </div>
      </section>

      {/* Code */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          How It Works
        </h2>
        <div className="rounded-xl bg-stone-900 dark:bg-stone-900/80 border border-stone-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
            </div>
            <span className="text-xs text-stone-500 ml-2">app/head-demo/head.tsx</span>
          </div>
          <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
            <code className="text-stone-300">
              {'import type { '}
              <span className="text-orange-400">HeadDescriptor</span>
              {" } from '@paretojs/core'\n\n"}
              {'export function '}
              <span className="text-orange-400">head</span>
              {'(): HeadDescriptor {\n'}
              {'  return {\n'}
              {"    title: 'Head Management — Pareto',\n"}
              {'    meta: [\n'}
              {"      { name: 'description', content: '...' },\n"}
              {"      { property: 'og:type', content: 'website' },\n"}
              {'    ],\n'}
              {'  }\n'}
              {'}'}
            </code>
          </pre>
        </div>
      </section>
    </div>
  )
}

function HeadRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4 py-3 px-5">
      <span className="text-xs font-mono text-stone-400 dark:text-stone-500 shrink-0 w-36">
        {label}
      </span>
      <span className="text-sm text-stone-700 dark:text-stone-300 break-all">
        {value}
      </span>
    </div>
  )
}

function NavChip({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <Link
      href={href}
      className="group block py-3 px-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-orange-300 dark:hover:border-orange-800 transition-colors"
    >
      <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
        {label}
      </span>
      <span className="block text-xs text-stone-400 dark:text-stone-500 mt-0.5 font-mono">
        {title}
      </span>
    </Link>
  )
}
