import type { HeadDescriptor } from '../types'

/**
 * Update the document <head> on client-side navigation.
 * Manages title, meta tags, and link tags marked with data-pareto.
 */
export function updateHead(head: HeadDescriptor) {
  if (typeof document === 'undefined') return

  // Update title
  if (head.title) {
    document.title = head.title
  }

  // Replace pareto-managed meta tags
  document.querySelectorAll('meta[data-pareto]').forEach((el) => el.remove())
  if (head.meta) {
    for (const attrs of head.meta) {
      const el = document.createElement('meta')
      el.setAttribute('data-pareto', '')
      for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value)
      }
      document.head.appendChild(el)
    }
  }

  // Replace pareto-managed link tags
  document.querySelectorAll('link[data-pareto]').forEach((el) => el.remove())
  if (head.link) {
    for (const attrs of head.link) {
      const el = document.createElement('link')
      el.setAttribute('data-pareto', '')
      for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value)
      }
      document.head.appendChild(el)
    }
  }
}

/**
 * Merge head descriptors from nested layouts.
 * Deeper routes override shallower ones for title.
 * Meta tags with the same name/property are overridden; otherwise they accumulate.
 */
export function mergeHeadDescriptors(...heads: (HeadDescriptor | undefined)[]): HeadDescriptor {
  const result: HeadDescriptor = {
    meta: [],
    link: [],
  }

  const metaMap = new Map<string, Record<string, string>>()
  const linkMap = new Map<string, Record<string, string>>()

  for (const head of heads) {
    if (!head) continue

    // Title: last one wins
    if (head.title) {
      result.title = head.title
    }

    // Meta: deduplicate by name or property
    if (head.meta) {
      for (const attrs of head.meta) {
        const key = attrs.name || attrs.property || JSON.stringify(attrs)
        metaMap.set(key, attrs)
      }
    }

    // Link: deduplicate by rel+href
    if (head.link) {
      for (const attrs of head.link) {
        const key = `${attrs.rel}:${attrs.href}`
        linkMap.set(key, attrs)
      }
    }
  }

  result.meta = [...metaMap.values()]
  result.link = [...linkMap.values()]

  return result
}
