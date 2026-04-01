import { useRouterContext } from './context'

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
    push: ctx.push,
    replace: ctx.replace,
    back: ctx.back,
    prefetch: ctx.prefetch,
  }
}
