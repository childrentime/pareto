import type { ReactNode } from 'react'
import { Suspense, createElement, use } from 'react'
import { DeferredData } from '../types'

interface AwaitProps<T> {
  resolve: Promise<T> | T
  fallback?: ReactNode
  children: (data: T) => ReactNode
}

/**
 * Component that renders streamed deferred data.
 * Wraps a Promise in a Suspense boundary — shows fallback until resolved.
 *
 * @example
 * ```tsx
 * <Await resolve={data.activity} fallback={<Skeleton />}>
 *   {(activity) => <ActivityFeed items={activity} />}
 * </Await>
 * ```
 */
export function Await<T>({ resolve, fallback, children }: AwaitProps<T>) {
  return createElement(
    Suspense,
    { fallback: fallback ?? null },
    createElement(AwaitInner<T>, { resolve, children }),
  )
}

function AwaitInner<T>({
  resolve,
  children,
}: {
  resolve: Promise<T> | T
  children: (data: T) => ReactNode
}) {
  const data = resolve instanceof Promise ? use(resolve) : resolve
  return children(data) as React.JSX.Element
}

/**
 * Hook to access a specific deferred value from loader data.
 * For use when you want to consume a deferred value without <Await>.
 *
 * @example
 * ```tsx
 * function Activity() {
 *   const data = useStreamData(loaderData.activity)
 *   return <div>{data.items.length} items</div>
 * }
 * ```
 */
export function useStreamData<T>(promiseOrValue: Promise<T> | T): T {
  if (promiseOrValue instanceof Promise) {
    return use(promiseOrValue)
  }
  return promiseOrValue
}

/**
 * Check if a loader result is deferred data.
 */
export function isDeferredData(value: unknown): value is DeferredData {
  return value instanceof DeferredData
}

/**
 * Serialize deferred data for transfer to the client.
 * Resolved values are serialized immediately.
 * Promises are replaced with markers that the client replaces
 * with actual promises that resolve when the streamed script arrives.
 */
export function serializeDeferredData(data: DeferredData): {
  resolved: Record<string, unknown>
  pendingKeys: string[]
} {
  const resolved: Record<string, unknown> = {}
  const pendingKeys: string[] = []

  for (const [key, value] of Object.entries(data.data)) {
    if (value instanceof Promise) {
      pendingKeys.push(key)
    } else {
      resolved[key] = value
    }
  }

  return { resolved, pendingKeys }
}
