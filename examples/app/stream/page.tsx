import { useEffect, useState } from 'react'
import { Await, defer, Link, useLoaderData } from '@paretojs/core'
import type { LoaderContext } from '@paretojs/core'

interface StreamData {
  quickStats: { users: number; posts: number; uptime: string }
  deployments: Promise<
    { id: number; name: string; env: string; time: string }[]
  >
  analytics: Promise<{ label: string; value: string; trend: string }[]>
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function loader(_ctx: LoaderContext) {
  const quickStats = { users: 12_847, posts: 48_392, uptime: '99.97%' }

  const deployments = sleep(1500).then(() => [
    { id: 1, name: 'v3.0.1 Hotfix', env: 'production', time: '4 min ago' },
    { id: 2, name: 'v3.0.0 Major', env: 'production', time: '2 hours ago' },
    { id: 3, name: 'v2.9.8 Patch', env: 'staging', time: 'yesterday' },
  ])

  const analytics = sleep(2500).then(() => [
    { label: 'Avg. Response', value: '42ms', trend: '-12%' },
    { label: 'Cache Hit Rate', value: '94.2%', trend: '+3.1%' },
    { label: 'Error Rate', value: '0.03%', trend: '-0.01%' },
  ])

  return defer({ quickStats, deployments, analytics })
}

export default function StreamPage() {
  const data = useLoaderData<StreamData>()

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
          Streaming SSR
        </h1>
        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl">
          The shell and quick stats rendered instantly on the server. Watch the
          remaining sections stream in as each promise resolves&mdash;skeleton
          placeholders show until data arrives.
        </p>
      </div>

      <ElapsedTimer />

      {/* Instant: Quick Stats */}
      <section className="mb-10">
        <SectionHeader badge="ready" badgeColor="emerald">
          Quick Stats
        </SectionHeader>
        <div className="flex flex-wrap gap-8 lg:gap-12">
          <Stat
            value={data.quickStats.users.toLocaleString()}
            label="users"
          />
          <Stat
            value={data.quickStats.posts.toLocaleString()}
            label="posts"
          />
          <Stat value={data.quickStats.uptime} label="uptime" />
        </div>
      </section>

      <Divider />

      {/* Deferred: Deployments (~1.5s) */}
      <section className="mb-10">
        <SectionHeader badge="~1.5s" badgeColor="stone">
          Recent Deployments
        </SectionHeader>
        <Await
          resolve={data.deployments}
          fallback={<ListSkeleton count={3} />}
        >
          {(items) => (
            <div className="space-y-2 animate-fade-up">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
                      {item.name}
                    </span>
                    <span className="hidden sm:inline text-[0.6875rem] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 font-mono">
                      {item.env}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0 ml-4">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Await>
      </section>

      <Divider />

      {/* Deferred: Analytics (~2.5s) */}
      <section>
        <SectionHeader badge="~2.5s" badgeColor="stone">
          Performance Analytics
        </SectionHeader>
        <Await
          resolve={data.analytics}
          fallback={<CardSkeleton count={3} />}
        >
          {(items) => (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up">
              {items.map((item) => (
                <div
                  key={item.label}
                  className="py-4 px-5 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 transition-colors duration-300"
                >
                  <span className="text-[0.6875rem] text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
                      {item.value}
                    </span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Await>
      </section>
    </div>
  )
}

function ElapsedTimer() {
  const [elapsed, setElapsed] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const start = performance.now()
    let id: number
    const tick = () => {
      const now = performance.now()
      setElapsed(Math.floor((now - start) / 100) / 10)
      if (now - start < 5000) {
        id = requestAnimationFrame(tick)
      }
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [])

  if (!mounted) return <div className="h-6 mb-10" />

  return (
    <div className="mb-10 flex items-center gap-2.5 text-xs font-mono text-stone-400 dark:text-stone-500">
      <span
        className={`w-1.5 h-1.5 rounded-full ${elapsed < 5 ? 'bg-orange-500 animate-pulse' : 'bg-stone-300 dark:bg-stone-700'}`}
      />
      <span className="tabular-nums">{elapsed.toFixed(1)}s elapsed</span>
    </div>
  )
}

function SectionHeader({
  children,
  badge,
  badgeColor,
}: {
  children: React.ReactNode
  badge: string
  badgeColor: 'emerald' | 'stone'
}) {
  const colors =
    badgeColor === 'emerald'
      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
      : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-900 dark:text-stone-100">
        {children}
      </h2>
      <span
        className={`text-[0.6875rem] leading-none px-2 py-1 rounded-full font-medium ${colors}`}
      >
        {badge}
      </span>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span className="text-3xl font-semibold tabular-nums text-stone-900 dark:text-stone-50">
        {value}
      </span>
      <span className="text-sm text-stone-400 dark:text-stone-500 ml-2">
        {label}
      </span>
    </div>
  )
}

function Divider() {
  return (
    <div className="h-px bg-stone-200 dark:bg-stone-800 mb-10 transition-colors duration-300" />
  )
}

function ListSkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[52px] rounded-lg bg-stone-100 dark:bg-stone-800/60 animate-pulse transition-colors duration-300"
        />
      ))}
    </div>
  )
}

function CardSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[76px] rounded-lg bg-stone-100 dark:bg-stone-800/60 animate-pulse transition-colors duration-300"
        />
      ))}
    </div>
  )
}
