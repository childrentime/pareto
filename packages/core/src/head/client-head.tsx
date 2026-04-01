import type { ReactNode } from 'react'
import { isValidElement, useEffect, useRef, useState } from 'react'
import type { ClientRoute } from '../render/client'
import type { HeadComponent } from '../types'
import { HEAD_ATTR } from './constants'
import { dedupeHeadElements, flattenHeadChildren } from './dedupe'

/**
 * Client-side head manager. Lazily loads head.tsx files for the
 * current route, deduplicates parent/child tags, and renders them
 * as plain React elements. React 19 automatically hoists `<title>`,
 * `<meta>`, `<link>` etc. into `<head>`.
 *
 * After React commits the new tags to the DOM, `useEffect` removes
 * stale SSR / previous-route tags marked with `data-pareto-head`.
 * This order (render new → remove old) prevents title flicker.
 */
export function RouteHead({
  route,
  loaderData,
  params,
}: {
  route: ClientRoute | undefined
  loaderData: unknown
  params: Record<string, string>
}) {
  const [HeadComponents, setHeadComponents] = useState<HeadComponent[]>([])
  const loadedPathRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!route?.headLoaders?.length) {
      if (HeadComponents.length > 0) setHeadComponents([])
      return
    }

    const routePath = route.path
    if (loadedPathRef.current === routePath) return
    loadedPathRef.current = routePath

    void Promise.all(route.headLoaders.map(loader => loader())).then(
      modules => {
        const components = modules
          .map(mod => mod.default)
          .filter((c): c is HeadComponent => typeof c === 'function')
        setHeadComponents(components)
      },
    )
  }, [route?.path])

  // Clean up old SSR tags only after new ones are in the DOM
  useEffect(() => {
    if (HeadComponents.length === 0) return
    for (const el of document.head.querySelectorAll(`[${HEAD_ATTR}]`)) {
      el.remove()
    }
  }, [HeadComponents])

  if (HeadComponents.length === 0) return null

  const allChildren: ReactNode[] = []
  for (const Head of HeadComponents) {
    allChildren.push(...flattenHeadChildren(Head({ loaderData, params })))
  }
  const deduped = dedupeHeadElements(allChildren)

  return (
    <>
      {deduped.map((el, i) =>
        isValidElement(el) ? { ...el, key: el.key ?? `head-${i}` } : el,
      )}
    </>
  )
}
