import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent, AnchorHTMLAttributes } from 'react'
import { useRouterContext } from './context'

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  /** Prefetch strategy: 'hover' (default), 'viewport', or 'none' */
  prefetch?: 'hover' | 'viewport' | 'none'
  replace?: boolean
  scroll?: boolean
}

/**
 * Client-side navigation link component.
 * Intercepts clicks for same-origin links and navigates via the router.
 * Supports prefetching on hover or when entering the viewport.
 *
 * @example
 * ```tsx
 * <Link href="/about">About</Link>
 * <Link href="/blog/hello" prefetch="viewport">Read Post</Link>
 * <Link href="/login" replace>Login</Link>
 * ```
 */
export function Link({
  href,
  prefetch = 'hover',
  replace = false,
  scroll = true,
  children,
  onClick,
  onMouseEnter,
  ...rest
}: LinkProps) {
  const { push, replace: nav_replace, prefetch: routerPrefetch } = useRouterContext()
  const prefetched = useRef(false)
  const elementRef = useRef<HTMLAnchorElement>(null)

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return
      // Allow standard browser behavior for modifier keys / external links
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      if (e.button !== 0) return

      const target = (e.currentTarget as HTMLAnchorElement).getAttribute('target')
      if (target && target !== '_self') return

      // Only intercept same-origin navigation
      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return
      } catch {
        return
      }

      e.preventDefault()
      if (replace) {
        nav_replace(href, { scroll })
      } else {
        push(href, { scroll })
      }
    },
    [href, push, nav_replace, replace, scroll, onClick],
  )

  const handleMouseEnter = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onMouseEnter?.(e)
      if (prefetch === 'hover' && !prefetched.current) {
        prefetched.current = true
        routerPrefetch(href)
      }
    },
    [href, prefetch, onMouseEnter, routerPrefetch],
  )

  // Viewport-based prefetching via IntersectionObserver
  useEffect(() => {
    if (prefetch !== 'viewport' || prefetched.current) return
    const el = elementRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !prefetched.current) {
            prefetched.current = true
            routerPrefetch(href)
            observer.disconnect()
          }
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [href, prefetch, routerPrefetch])

  return (
    <a
      ref={elementRef}
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      {...rest}
    >
      {children}
    </a>
  )
}
