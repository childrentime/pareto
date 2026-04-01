import type { ReactElement, ReactNode } from 'react'
import { createElement, Fragment, isValidElement } from 'react'
import { isDeferredData } from '../data/streaming'
import type { HeadComponent, RouteDef } from '../types'
import { HEAD_ATTR } from './constants'
import { dedupeHeadElements, flattenHeadChildren } from './dedupe'

/**
 * Clone a React element and add the `data-pareto-head` marker attribute.
 * The client head manager removes all marked elements on mount so that
 * React 19's client-side hoisting doesn't create duplicates.
 */
function markForClient(node: ReactNode, index: number): ReactNode {
  if (!isValidElement(node)) return node
  const el = node as ReactElement<Record<string, unknown>>
  return createElement(el.type as string, {
    ...el.props,
    [HEAD_ATTR]: '',
    key: el.key ?? `head-${index}`,
  })
}

/**
 * Resolve and render Head components for a matched route on the server.
 *
 * Head files are collected from root → page (parent → child).
 * Child elements override parent elements with the same dedup key.
 * All output elements are tagged with `data-pareto-head` so the
 * client can remove them on hydration.
 */
export function resolveServerHead(
  route: RouteDef,
  loaderData: unknown,
  params: Record<string, string>,
  requireModule: (path: string) => unknown,
): ReactNode {
  if (route.headPaths.length === 0) return null

  const resolvedData = isDeferredData(loaderData) ? loaderData.data : loaderData
  const props = { loaderData: resolvedData, params }

  const allChildren: ReactNode[] = []
  for (const hp of route.headPaths) {
    const headMod = requireModule(hp) as Record<string, unknown>
    const Head = headMod.default as HeadComponent | undefined
    if (Head) {
      const output = Head(props)
      allChildren.push(...flattenHeadChildren(output))
    }
  }

  if (allChildren.length === 0) return null

  const deduped = dedupeHeadElements(allChildren)
  if (deduped.length === 0) return null

  const marked = deduped.map(markForClient)
  if (marked.length === 1) return marked[0]
  return createElement(Fragment, null, ...marked)
}
