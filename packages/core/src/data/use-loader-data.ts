import { createContext, useContext } from 'react'

/**
 * Context that holds loader data for the current route segment.
 * Each segment in the nested layout chain gets its own provider.
 */
export const LoaderDataContext = createContext<unknown>(undefined)

/**
 * Access the loader data for the current route segment.
 * Must be used inside a component rendered by the router.
 *
 * @example
 * ```tsx
 * import type { LoaderData } from './loader'
 *
 * export default function BlogPost() {
 *   const data = useLoaderData<LoaderData>()
 *   return <h1>{data.title}</h1>
 * }
 * ```
 */
export function useLoaderData<T = unknown>(): T {
  const data = useContext(LoaderDataContext)
  if (data === undefined) {
    throw new Error(
      'useLoaderData must be used inside a route component. ' +
        'Make sure the component is rendered by the Pareto router.',
    )
  }
  return data as T
}
