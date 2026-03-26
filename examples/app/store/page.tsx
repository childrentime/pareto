import { Link } from '@paretojs/core'
import { defineStore } from '@paretojs/core/store'

interface CounterState {
  count: number
  history: string[]
  increment: () => void
  decrement: () => void
  reset: () => void
}

const counterStore = defineStore<CounterState>((set) => ({
  count: 0,
  history: [],
  increment: () =>
    set((draft) => {
      draft.count++
      draft.history.unshift(`+1 → ${draft.count}`)
    }),
  decrement: () =>
    set((draft) => {
      draft.count--
      draft.history.unshift(`-1 → ${draft.count}`)
    }),
  reset: () =>
    set((draft) => {
      const prev = draft.count
      draft.count = 0
      draft.history.unshift(`reset ${prev} → 0`)
    }),
}))

export default function StorePage() {
  const { count, history, increment, decrement, reset } =
    counterStore.useStore()

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
          Store
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Reactive state management built on Immer. Define stores with{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
            defineStore
          </code>
          , destructure directly in components.
        </p>
      </div>

      {/* Interactive Counter */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100 mb-5">
          Interactive Counter
        </h2>
        <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-8 transition-colors duration-300">
          <div className="flex items-center gap-8 mb-8">
            <span className="text-6xl font-semibold tabular-nums text-stone-900 dark:text-stone-50 min-w-[4ch] text-center">
              {count}
            </span>
            <div className="flex gap-2">
              <button
                onClick={decrement}
                className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-semibold text-lg flex items-center justify-center"
              >
                -
              </button>
              <button
                onClick={increment}
                className="w-10 h-10 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors font-semibold text-lg flex items-center justify-center"
              >
                +
              </button>
              <button
                onClick={reset}
                className="h-10 px-4 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div>
              <h3 className="text-[0.6875rem] text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-3">
                History
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {history.slice(0, 12).map((entry, i) => (
                  <span
                    key={`${entry}-${i}`}
                    className="text-xs font-mono px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                  >
                    {entry}
                  </span>
                ))}
                {history.length > 12 && (
                  <span className="text-xs font-mono px-2 py-1 text-stone-400 dark:text-stone-600">
                    +{history.length - 12} more
                  </span>
                )}
              </div>
            </div>
          )}
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
            <span className="text-xs text-stone-500 ml-2">
              app/store/page.tsx
            </span>
          </div>
          <pre className="p-5 text-[0.8125rem] leading-relaxed overflow-x-auto">
            <code className="text-stone-300">
              {'import { '}
              <span className="text-orange-400">defineStore</span>
              {" } from '@paretojs/core/store'\n\n"}
              {'const counterStore = '}
              <span className="text-orange-400">defineStore</span>
              {'((set) => ({\n'}
              {'  count: 0,\n'}
              {'  increment: () => set((draft) => {\n'}
              {'    draft.count++\n'}
              {'  }),\n'}
              {'  decrement: () => set((draft) => {\n'}
              {'    draft.count--\n'}
              {'  }),\n'}
              {'}))\n\n'}
              {'export default function StorePage() {\n'}
              {'  '}
              <span className="text-stone-500">
                {'// Direct destructuring — reactive\n'}
              </span>
              {'  const { count, increment } =\n'}
              {'    counterStore.'}
              <span className="text-orange-400">useStore</span>
              {'()\n\n'}
              {'  return <button onClick={increment}>{count}</button>\n'}
              {'}'}
            </code>
          </pre>
        </div>
      </section>
    </div>
  )
}
