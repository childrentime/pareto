import { createElement, Fragment } from 'react'
import { describe, expect, it } from 'vitest'
import {
  dedupeHeadElements,
  flattenHeadChildren,
  getDedupeKey,
} from '../head/dedupe'

describe('getDedupeKey', () => {
  it('returns "title" for <title> elements', () => {
    const el = createElement('title', null, 'Hello')
    expect(getDedupeKey(el)).toBe('title')
  })

  it('returns meta:name:X for <meta name="X">', () => {
    const el = createElement('meta', { name: 'description', content: 'test' })
    expect(getDedupeKey(el)).toBe('meta:name:description')
  })

  it('returns meta:property:X for <meta property="X">', () => {
    const el = createElement('meta', { property: 'og:title', content: 'hi' })
    expect(getDedupeKey(el)).toBe('meta:property:og:title')
  })

  it('returns meta:httpEquiv:X for <meta httpEquiv="X">', () => {
    const el = createElement('meta', { httpEquiv: 'refresh', content: '5' })
    expect(getDedupeKey(el)).toBe('meta:httpEquiv:refresh')
  })

  it('returns meta:charSet for <meta charSet="X">', () => {
    const el = createElement('meta', { charSet: 'utf-8' })
    expect(getDedupeKey(el)).toBe('meta:charSet')
  })

  it('returns null for <link> elements (never deduped)', () => {
    const el = createElement('link', { rel: 'stylesheet', href: '/a.css' })
    expect(getDedupeKey(el)).toBeNull()
  })

  it('returns null for <script> elements', () => {
    const el = createElement('script', { src: '/a.js' })
    expect(getDedupeKey(el)).toBeNull()
  })

  it('returns null for non-element nodes', () => {
    expect(getDedupeKey('text')).toBeNull()
    expect(getDedupeKey(null)).toBeNull()
    expect(getDedupeKey(42)).toBeNull()
  })

  it('returns null for <meta> without recognized attributes', () => {
    const el = createElement('meta', { itemProp: 'name' })
    expect(getDedupeKey(el)).toBeNull()
  })
})

describe('flattenHeadChildren', () => {
  it('flattens simple elements', () => {
    const children = createElement(
      Fragment,
      null,
      createElement('title', null, 'Hi'),
      createElement('meta', { name: 'a' }),
    )
    const result = flattenHeadChildren(children)
    expect(result).toHaveLength(2)
  })

  it('flattens nested fragments', () => {
    const inner = createElement(
      Fragment,
      null,
      createElement('title', null, 'Inner'),
    )
    const outer = createElement(
      Fragment,
      null,
      inner,
      createElement('meta', { name: 'b' }),
    )
    const result = flattenHeadChildren(outer)
    expect(result).toHaveLength(2)
  })

  it('skips non-element children (strings, numbers)', () => {
    const children = createElement(
      Fragment,
      null,
      'text',
      createElement('title', null, 'T'),
    )
    const result = flattenHeadChildren(children)
    expect(result).toHaveLength(1)
  })

  it('returns empty array for null input', () => {
    expect(flattenHeadChildren(null)).toHaveLength(0)
  })
})

describe('dedupeHeadElements', () => {
  it('keeps only the last <title> when duplicated', () => {
    const elements = [
      createElement('title', null, 'Root'),
      createElement('title', null, 'Page'),
    ]
    const result = dedupeHeadElements(elements)
    expect(result).toHaveLength(1)
    expect((result[0] as any).props.children).toBe('Page')
  })

  it('last meta[name] wins over earlier ones', () => {
    const elements = [
      createElement('meta', { name: 'description', content: 'root' }),
      createElement('meta', { name: 'description', content: 'page' }),
    ]
    const result = dedupeHeadElements(elements)
    expect(result).toHaveLength(1)
    expect((result[0] as any).props.content).toBe('page')
  })

  it('keeps different meta names as separate entries', () => {
    const elements = [
      createElement('meta', { name: 'description', content: 'desc' }),
      createElement('meta', { name: 'keywords', content: 'keys' }),
    ]
    const result = dedupeHeadElements(elements)
    expect(result).toHaveLength(2)
  })

  it('keeps non-deduplicable elements (link, script)', () => {
    const elements = [
      createElement('link', { rel: 'stylesheet', href: '/a.css' }),
      createElement('link', { rel: 'stylesheet', href: '/b.css' }),
      createElement('script', { src: '/a.js' }),
    ]
    const result = dedupeHeadElements(elements)
    expect(result).toHaveLength(3)
  })

  it('handles mixed deduplicable and non-deduplicable', () => {
    const elements = [
      createElement('title', null, 'Root'),
      createElement('link', { rel: 'icon', href: '/favicon.ico' }),
      createElement('title', null, 'Page'),
      createElement('meta', { name: 'description', content: 'root' }),
      createElement('meta', { name: 'description', content: 'page' }),
    ]
    const result = dedupeHeadElements(elements)
    expect(result).toHaveLength(3)
  })

  it('returns empty array for empty input', () => {
    expect(dedupeHeadElements([])).toHaveLength(0)
  })
})
