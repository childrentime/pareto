import type { ReactNode } from 'react'
import { Children, Fragment, isValidElement } from 'react'

const UNIQUE_META_ATTRS = ['name', 'property', 'httpEquiv', 'charSet'] as const

/**
 * Derive a deduplication key for a head element.
 *
 * - `<title>` → `"title"`
 * - `<meta name="X">` → `"meta:name:X"`
 * - `<meta property="X">` → `"meta:property:X"`
 * - `<meta httpEquiv="X">` → `"meta:httpEquiv:X"`
 * - `<meta charSet="X">` → `"meta:charSet"`
 * - Everything else → `null` (kept as-is, never deduped)
 */
export function getDedupeKey(node: ReactNode): string | null {
  if (!isValidElement(node)) return null
  const { type, props } = node as React.ReactElement<Record<string, unknown>>

  if (type === 'title') return 'title'

  if (type === 'meta') {
    for (const attr of UNIQUE_META_ATTRS) {
      if (typeof props[attr] === 'string') {
        return attr === 'charSet'
          ? 'meta:charSet'
          : `meta:${attr}:${props[attr]}`
      }
    }
  }

  return null
}

/**
 * Flatten Fragments into a flat list of valid React elements.
 */
export function flattenHeadChildren(node: ReactNode): ReactNode[] {
  const result: ReactNode[] = []
  Children.forEach(node, child => {
    if (!isValidElement(child)) return
    if (child.type === Fragment) {
      const { children } = child.props as { children?: ReactNode }
      result.push(...flattenHeadChildren(children))
    } else {
      result.push(child)
    }
  })
  return result
}

/**
 * Deduplicate head elements: later entries win over earlier ones
 * for tags with the same dedup key (title, meta[name], etc.).
 * Non-keyed elements (link, script, etc.) are always kept.
 */
export function dedupeHeadElements(elements: ReactNode[]): ReactNode[] {
  const seen = new Map<string, number>()
  for (let i = 0; i < elements.length; i++) {
    const key = getDedupeKey(elements[i])
    if (key) seen.set(key, i)
  }
  return elements.filter((child, i) => {
    const key = getDedupeKey(child)
    return key === null || seen.get(key) === i
  })
}
