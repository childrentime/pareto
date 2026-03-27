import type { ReactNode } from 'react'
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type {
  HeadDescriptor,
  NavigateOptions,
  RouteManifest,
  RouterState,
} from '../types'
import { updateHead } from './head-manager'

interface NavigationResult {
  loaderData: unknown
  params: Record<string, string>
  head?: HeadDescriptor
  /** If the loader threw a redirect, contains the target URL */
  redirect?: string
  /** If the server returned 404 */
  notFound?: boolean
  /** If the server returned an error */
  error?: string
}

interface RouterContextValue extends RouterState {
  push: (path: string, opts?: NavigateOptions) => void
  replace: (path: string, opts?: NavigateOptions) => void
  back: () => void
  prefetch: (path: string) => void
  manifest: RouteManifest | null
  loaderData: unknown
  setLoaderData: (data: unknown) => void
  /** Set when a client-side navigation returns 404 */
  isNotFound: boolean
  /** Set when a client-side navigation loader fails */
  navigationError: Error | null
}

export const RouterContext = createContext<RouterContextValue | null>(null)

export function RouterProvider({
  children,
  initialPathname,
  initialParams,
  initialLoaderData,
  initialError,
  manifest,
  onNavigate,
}: {
  children?: ReactNode
  initialPathname: string
  initialParams: Record<string, string>
  initialLoaderData: unknown
  initialError?: Error | null
  manifest: RouteManifest | null
  onNavigate?: (pathname: string) => Promise<NavigationResult>
}) {
  const [state, setState] = useState<RouterState>({
    pathname: initialPathname,
    params: initialParams,
    isNavigating: false,
  })
  const [loaderData, setLoaderData] = useState<unknown>(initialLoaderData)
  const [isNotFound, setIsNotFound] = useState(false)
  const [navigationError, setNavigationError] = useState<Error | null>(
    initialError ?? null,
  )
  const prefetchCacheRef = useRef(new Map<string, Promise<NavigationResult>>())
  const pendingScrollRef = useRef(false)

  const fetchRouteData = useCallback(
    async (path: string): Promise<NavigationResult | undefined> => {
      // Check prefetch cache first
      const cached = prefetchCacheRef.current.get(path)
      if (cached) {
        prefetchCacheRef.current.delete(path)
        return cached
      }
      return onNavigate?.(path)
    },
    [onNavigate],
  )

  const navigate = useCallback(
    async (path: string, opts?: NavigateOptions) => {
      // Strip query string from pathname for route matching and state,
      // but pass the full path to fetchRouteData and history API
      const pathname = path.split('?')[0]
      if (path === state.pathname && !opts?.replace) return

      setState(s => ({ ...s, isNavigating: true }))

      try {
        const result = await fetchRouteData(path)

        // Handle server-side redirect
        if (result?.redirect) {
          setState(s => ({ ...s, isNavigating: false }))
          // Follow the redirect by navigating to the new URL
          void navigate(result.redirect, { replace: true })
          return
        }

        // Handle 404
        if (result?.notFound) {
          startTransition(() => {
            if (opts?.replace) {
              history.replaceState(null, '', path)
            } else {
              history.pushState(null, '', path)
            }
            setState({
              pathname,
              params: {},
              isNavigating: false,
            })
            setIsNotFound(true)
            setNavigationError(null)
            if (opts?.scroll !== false) {
              pendingScrollRef.current = true
            }
          })
          return
        }

        // Handle loader error
        if (result?.error) {
          startTransition(() => {
            if (opts?.replace) {
              history.replaceState(null, '', path)
            } else {
              history.pushState(null, '', path)
            }
            setState({
              pathname,
              params: result?.params ?? {},
              isNavigating: false,
            })
            setNavigationError(new Error(result.error))
            setIsNotFound(false)
            if (opts?.scroll !== false) {
              pendingScrollRef.current = true
            }
          })
          return
        }

        startTransition(() => {
          if (opts?.replace) {
            history.replaceState(null, '', path)
          } else {
            history.pushState(null, '', path)
          }

          setState({
            pathname,
            params: result?.params ?? {},
            isNavigating: false,
          })

          if (result?.loaderData !== undefined) {
            setLoaderData(result.loaderData)
          }

          setIsNotFound(false)
          setNavigationError(null)

          // Update document head on client-side navigation
          if (result?.head) {
            updateHead(result.head)
          }

          if (opts?.scroll !== false) {
            pendingScrollRef.current = true
          }
        })
      } catch {
        setState(s => ({ ...s, isNavigating: false }))
      }
    },
    [state.pathname, fetchRouteData],
  )

  const push = useCallback(
    (path: string, opts?: NavigateOptions) => navigate(path, opts),
    [navigate],
  )

  const replace = useCallback(
    (path: string, opts?: NavigateOptions) =>
      navigate(path, { ...opts, replace: true }),
    [navigate],
  )

  const back = useCallback(() => history.back(), [])

  const prefetch = useCallback(
    (path: string) => {
      if (prefetchCacheRef.current.has(path)) return
      if (!onNavigate) return
      const promise = onNavigate(path)
      prefetchCacheRef.current.set(path, promise)

      // Also prefetch JS chunks via modulepreload hints
      if (manifest) {
        const entry = Object.values(manifest.routes).find(r => r.path === path)
        if (entry?.js) {
          for (const jsUrl of entry.js) {
            const link = document.createElement('link')
            link.rel = 'modulepreload'
            link.href = jsUrl
            document.head.appendChild(link)
          }
        }
      }
    },
    [onNavigate, manifest],
  )

  // Scroll to top after React commits the new page — avoids flashing
  // the old page at scroll position 0 before the new content renders.
  useLayoutEffect(() => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false
      window.scrollTo(0, 0)
    }
  }, [state.pathname])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      void navigate(path, { replace: true, scroll: false })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  // Handle streamed deferred data
  useEffect(() => {
    const handleDeferred = (event: Event) => {
      const key = (event as CustomEvent<string>).detail
      const routeData = window.__ROUTE_DATA__
      const value = routeData?.[key]
      if (value !== undefined) {
        setLoaderData((prev: unknown) => ({
          ...(prev as Record<string, unknown>),
          [key]: value,
        }))
      }
    }
    document.addEventListener('pareto:deferred', handleDeferred)
    return () => document.removeEventListener('pareto:deferred', handleDeferred)
  }, [])

  return (
    <RouterContext.Provider
      value={{
        ...state,
        push,
        replace,
        back,
        prefetch,
        manifest,
        loaderData,
        setLoaderData,
        isNotFound,
        navigationError,
      }}
    >
      {children}
    </RouterContext.Provider>
  )
}

export function useRouterContext(): RouterContextValue {
  const ctx = useContext(RouterContext)
  if (!ctx) {
    throw new Error('useRouter must be used within RouterProvider')
  }
  return ctx
}
