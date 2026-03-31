import type { ReactNode } from 'react'
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type {
  NavigateOptions,
  RouteManifest,
  RouteManifestEntry,
  RouterState,
} from '../types'
import { pathToRegex } from './route-matcher'

interface NavigationResult {
  loaderData: unknown
  params: Record<string, string>
  redirect?: string
  notFound?: boolean
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
  isNotFound: boolean
  navigationError: Error | null
}

export const RouterContext = createContext<RouterContextValue | null>(null)

/**
 * Build regex matchers from manifest route patterns for prefetch matching.
 * Converts route path patterns like "/blog/:slug" into RegExp objects
 * so prefetch can match actual URLs to their route entries.
 */
function buildManifestMatchers(manifest: RouteManifest | null) {
  if (!manifest) return []
  return Object.values(manifest.routes).map(entry => {
    return { entry, regex: pathToRegex(entry.path) }
  })
}

function findManifestEntry(
  matchers: { entry: RouteManifestEntry; regex: RegExp }[],
  pathname: string,
): RouteManifestEntry | undefined {
  const stripped = pathname.split('?')[0]
  return matchers.find(m => m.regex.test(stripped))?.entry
}

export function RouterProvider({
  children,
  initialPathname,
  initialParams,
  initialLoaderData,
  initialError,
  initialNotFound,
  manifest,
  onNavigate,
}: {
  children?: ReactNode
  initialPathname: string
  initialParams: Record<string, string>
  initialLoaderData: unknown
  initialError?: Error | null
  initialNotFound?: boolean
  manifest: RouteManifest | null
  onNavigate?: (pathname: string) => Promise<NavigationResult>
}) {
  const [state, setState] = useState<RouterState>({
    pathname: initialPathname,
    params: initialParams,
    isNavigating: false,
  })
  const [loaderData, setLoaderData] = useState<unknown>(initialLoaderData)
  const [isNotFound, setIsNotFound] = useState(initialNotFound ?? false)
  const [navigationError, setNavigationError] = useState<Error | null>(
    initialError ?? null,
  )
  const prefetchCacheRef = useRef(new Map<string, Promise<NavigationResult>>())
  const pendingScrollRef = useRef(false)

  // Stable ref for current pathname — avoids closing over state.pathname
  const pathnameRef = useRef(state.pathname)
  pathnameRef.current = state.pathname

  const manifestMatchers = useMemo(
    () => buildManifestMatchers(manifest),
    [manifest],
  )

  const fetchRouteData = useCallback(
    async (path: string): Promise<NavigationResult | undefined> => {
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
      const pathname = path.split('?')[0]
      if (path === pathnameRef.current && !opts?.replace) return

      setState(s => ({ ...s, isNavigating: true }))

      try {
        const result = await fetchRouteData(path)

        if (result?.redirect) {
          setState(s => ({ ...s, isNavigating: false }))
          void navigate(result.redirect, { replace: true })
          return
        }

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

          if (opts?.scroll !== false) {
            pendingScrollRef.current = true
          }
        })
      } catch (err) {
        startTransition(() => {
          setState(s => ({ ...s, isNavigating: false }))
          setNavigationError(
            err instanceof Error ? err : new Error(String(err)),
          )
        })
      }
    },
    [fetchRouteData],
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

      // Prefetch JS chunks via modulepreload — use regex matching for dynamic routes
      const entry = findManifestEntry(manifestMatchers, path)
      if (entry?.js) {
        for (const jsUrl of entry.js) {
          if (document.querySelector(`link[href="${jsUrl}"]`)) continue
          const link = document.createElement('link')
          link.rel = 'modulepreload'
          link.href = jsUrl
          document.head.appendChild(link)
        }
      }
    },
    [onNavigate, manifestMatchers],
  )

  useLayoutEffect(() => {
    if (pendingScrollRef.current) {
      pendingScrollRef.current = false
      window.scrollTo(0, 0)
    }
  }, [state.pathname])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      void navigate(path, { replace: true, scroll: false })
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

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
