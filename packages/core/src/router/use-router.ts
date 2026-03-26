import { useRouterContext } from './context'
import type { NavigateOptions, RouterState } from '../types'

/**
 * Hook to access the client-side router for programmatic navigation.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { push, replace, back, pathname, isNavigating, prefetch } = useRouter()
 *   const handleLogin = () => push('/dashboard')
 * }
 * ```
 */
export function useRouter() {
  const ctx = useRouterContext()
  return {
    pathname: ctx.pathname,
    params: ctx.params,
    isNavigating: ctx.isNavigating,
    push: (path: string, opts?: NavigateOptions) => ctx.push(path, opts),
    replace: (path: string, opts?: NavigateOptions) => ctx.replace(path, opts),
    back: () => ctx.back(),
    prefetch: (path: string) => ctx.prefetch(path),
  }
}

/**
 * Hook to access the raw router state (pathname, params, isNavigating).
 * Lower-level than useRouter — does not include navigation methods.
 */
export function useRouterSnapshot(): RouterState {
  const ctx = useRouterContext()
  return {
    pathname: ctx.pathname,
    params: ctx.params,
    isNavigating: ctx.isNavigating,
  }
}
