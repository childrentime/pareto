'use client'

import { Link } from '@paretojs/core'
import {
  useCounter,
  useDebounce,
  useDocumentVisibility,
  useToggle,
  useWindowSize,
} from '@reactuses/core'
import { useState } from 'react'

export default function HooksPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="text-sm font-medium text-orange-700 hover:underline"
      >
        &larr; Home
      </Link>
      <h1 className="text-3xl font-bold text-stone-900 mt-4 mb-2">
        React Hooks
      </h1>
      <p className="text-stone-500 mb-10 leading-relaxed">
        Demos of{' '}
        <code className="px-1.5 py-0.5 bg-stone-100 rounded text-sm font-mono">
          @reactuses/core
        </code>{' '}
        hooks running with Pareto + custom Express server.
      </p>

      <div className="space-y-8">
        <WindowSizeDemo />
        <ToggleDemo />
        <DebounceDemo />
        <CounterDemo />
        <VisibilityDemo />
      </div>
    </div>
  )
}

function Card({
  title,
  hook,
  children,
}: {
  title: string
  hook: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-stone-200 p-6">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900">
          {title}
        </h2>
        <code className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
          {hook}
        </code>
      </div>
      {children}
    </section>
  )
}

function WindowSizeDemo() {
  const { width, height } = useWindowSize()

  return (
    <Card title="Window Size" hook="useWindowSize">
      <p className="text-sm text-stone-700 font-mono">
        {width} &times; {height}
      </p>
      <p className="text-xs text-stone-400 mt-2">
        Resize the window to see values update.
      </p>
    </Card>
  )
}

function ToggleDemo() {
  const [on, toggle] = useToggle(false)

  return (
    <Card title="Toggle" hook="useToggle">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggle()}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            on ? 'bg-orange-600' : 'bg-stone-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
              on ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-sm font-mono text-stone-700">
          {on ? 'ON' : 'OFF'}
        </span>
      </div>
    </Card>
  )
}

function DebounceDemo() {
  const [input, setInput] = useState('')
  const debounced = useDebounce(input, 500)

  return (
    <Card title="Debounce" hook="useDebounce">
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Type something..."
        className="w-full px-3 py-2 rounded border border-stone-200 bg-stone-50 text-stone-900 text-sm outline-none focus:border-orange-500 transition-colors mb-3"
      />
      <div className="flex gap-4 text-sm">
        <span className="text-stone-400">
          input:{' '}
          <span className="font-mono text-stone-700">{input || '—'}</span>
        </span>
        <span className="text-stone-400">
          debounced:{' '}
          <span className="font-mono text-stone-700">{debounced || '—'}</span>
        </span>
      </div>
    </Card>
  )
}

function CounterDemo() {
  const [count, { inc, dec, reset }] = useCounter(0)

  return (
    <Card title="Counter" hook="useCounter">
      <div className="flex items-center gap-4">
        <span className="text-3xl font-semibold tabular-nums text-stone-900 min-w-[3ch] text-center">
          {count}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => dec()}
            className="w-9 h-9 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors font-semibold flex items-center justify-center"
          >
            -
          </button>
          <button
            onClick={() => inc()}
            className="w-9 h-9 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-700 transition-colors font-semibold flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => reset()}
            className="h-9 px-3 rounded-lg text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </Card>
  )
}

function VisibilityDemo() {
  const visibility = useDocumentVisibility()

  return (
    <Card title="Document Visibility" hook="useDocumentVisibility">
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            visibility === 'visible' ? 'bg-green-500' : 'bg-stone-400'
          }`}
        />
        <span className="text-sm font-mono text-stone-700">{visibility}</span>
      </div>
      <p className="text-xs text-stone-400 mt-2">Switch tabs and come back.</p>
    </Card>
  )
}
