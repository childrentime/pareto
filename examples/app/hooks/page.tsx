'use client'

import { Link } from '@paretojs/core'
import {
  useCounter,
  useDebounce,
  useDocumentVisibility,
  useMouse,
  useNetwork,
  useThrottle,
  useToggle,
  useWindowSize,
} from '@reactuses/core'
import { useState } from 'react'

export default function HooksPage() {
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
          React Hooks
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          Interactive demos of{' '}
          <code className="text-[0.8125rem] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-orange-700 dark:text-orange-400">
            @reactuses/core
          </code>{' '}
          hooks running in Pareto's SSR environment.
        </p>
      </div>

      <div className="space-y-8">
        <WindowSizeDemo />
        <MouseTrackerDemo />
        <ToggleDemo />
        <DebounceDemo />
        <ThrottleDemo />
        <CounterDemo />
        <VisibilityDemo />
        <NetworkDemo />
      </div>
    </div>
  )
}

function SectionCard({
  title,
  hook,
  children,
}: {
  title: string
  hook: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100">
          {title}
        </h2>
        <code className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
          {hook}
        </code>
      </div>
      <div className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-6 transition-colors duration-300">
        {children}
      </div>
    </section>
  )
}

function Pill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800">
      <span className="text-xs text-stone-400 dark:text-stone-500">
        {label}
      </span>
      <span className="text-sm font-mono font-medium text-stone-900 dark:text-stone-100">
        {value}
      </span>
    </div>
  )
}

function WindowSizeDemo() {
  const { width, height } = useWindowSize()

  return (
    <SectionCard title="Window Size" hook="useWindowSize">
      <div className="flex flex-wrap gap-3">
        <Pill label="width" value={`${width}px`} />
        <Pill label="height" value={`${height}px`} />
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
        Resize the browser window to see values update in real time.
      </p>
    </SectionCard>
  )
}

function MouseTrackerDemo() {
  const { clientX, clientY, screenX, screenY } = useMouse()

  return (
    <SectionCard title="Mouse Tracker" hook="useMouse">
      <div className="flex flex-wrap gap-3">
        <Pill label="clientX" value={clientX} />
        <Pill label="clientY" value={clientY} />
        <Pill label="screenX" value={screenX} />
        <Pill label="screenY" value={screenY} />
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
        Move your mouse anywhere on the page to see values update.
      </p>
    </SectionCard>
  )
}

function ToggleDemo() {
  const [on, toggle] = useToggle(false)

  return (
    <SectionCard title="Toggle" hook="useToggle">
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggle()}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            on ? 'bg-orange-600' : 'bg-stone-300 dark:bg-stone-600'
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${
              on ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>
        <span className="text-sm font-mono text-stone-700 dark:text-stone-300">
          {on ? 'ON' : 'OFF'}
        </span>
      </div>
    </SectionCard>
  )
}

function DebounceDemo() {
  const [input, setInput] = useState('')
  const debounced = useDebounce(input, 500)

  return (
    <SectionCard title="Debounce" hook="useDebounce">
      <div className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type something..."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm outline-none focus:border-orange-500 transition-colors"
        />
        <div className="flex gap-3">
          <Pill label="input" value={input || '(empty)'} />
          <Pill label="debounced (500ms)" value={debounced || '(empty)'} />
        </div>
      </div>
    </SectionCard>
  )
}

function ThrottleDemo() {
  const [input, setInput] = useState('')
  const throttled = useThrottle(input, 1000)

  return (
    <SectionCard title="Throttle" hook="useThrottle">
      <div className="space-y-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type rapidly..."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm outline-none focus:border-orange-500 transition-colors"
        />
        <div className="flex gap-3">
          <Pill label="input" value={input || '(empty)'} />
          <Pill label="throttled (1s)" value={throttled || '(empty)'} />
        </div>
      </div>
    </SectionCard>
  )
}

function CounterDemo() {
  const [count, { inc, dec, reset, set }] = useCounter(0)

  return (
    <SectionCard title="Counter" hook="useCounter">
      <div className="flex items-center gap-4">
        <span className="text-4xl font-semibold tabular-nums text-stone-900 dark:text-stone-50 min-w-[3ch] text-center">
          {count}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => dec()}
            className="w-10 h-10 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors font-semibold text-lg flex items-center justify-center"
          >
            -
          </button>
          <button
            onClick={() => inc()}
            className="w-10 h-10 rounded-lg bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-700 dark:hover:bg-stone-300 transition-colors font-semibold text-lg flex items-center justify-center"
          >
            +
          </button>
          <button
            onClick={() => set(10)}
            className="h-10 px-3 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Set 10
          </button>
          <button
            onClick={() => reset()}
            className="h-10 px-3 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </SectionCard>
  )
}

function VisibilityDemo() {
  const visibility = useDocumentVisibility()

  return (
    <SectionCard title="Document Visibility" hook="useDocumentVisibility">
      <div className="flex items-center gap-3">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            visibility === 'visible' ? 'bg-green-500' : 'bg-stone-400'
          }`}
        />
        <span className="text-sm font-mono text-stone-700 dark:text-stone-300">
          {visibility}
        </span>
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500 mt-3">
        Switch to another tab and come back to see the state change.
      </p>
    </SectionCard>
  )
}

function NetworkDemo() {
  const network = useNetwork()

  return (
    <SectionCard title="Network State" hook="useNetwork">
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800">
          <div
            className={`w-2 h-2 rounded-full ${
              network.online ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm font-mono text-stone-900 dark:text-stone-100">
            {network.online ? 'Online' : 'Offline'}
          </span>
        </div>
        {network.effectiveType && (
          <Pill label="connection" value={network.effectiveType} />
        )}
        {network.downlink !== undefined && (
          <Pill label="downlink" value={`${network.downlink} Mbps`} />
        )}
        {network.rtt !== undefined && (
          <Pill label="rtt" value={`${network.rtt}ms`} />
        )}
      </div>
    </SectionCard>
  )
}
