import { describe, it, expect } from 'vitest'
import { mergeHeadDescriptors } from '../router/head-manager'

describe('mergeHeadDescriptors', () => {
  it('returns empty descriptor when no heads provided', () => {
    const result = mergeHeadDescriptors()
    expect(result.title).toBeUndefined()
    expect(result.meta).toEqual([])
    expect(result.link).toEqual([])
  })

  it('returns single head as-is', () => {
    const result = mergeHeadDescriptors({
      title: 'Hello',
      meta: [{ name: 'description', content: 'test' }],
    })
    expect(result.title).toBe('Hello')
    expect(result.meta).toHaveLength(1)
  })

  it('last title wins when merging', () => {
    const result = mergeHeadDescriptors(
      { title: 'Root Title' },
      { title: 'Page Title' },
    )
    expect(result.title).toBe('Page Title')
  })

  it('keeps root title when page has no title', () => {
    const result = mergeHeadDescriptors(
      { title: 'Root Title' },
      { meta: [{ name: 'author', content: 'test' }] },
    )
    expect(result.title).toBe('Root Title')
  })

  it('deduplicates meta by name', () => {
    const result = mergeHeadDescriptors(
      { meta: [{ name: 'description', content: 'root desc' }] },
      { meta: [{ name: 'description', content: 'page desc' }] },
    )
    expect(result.meta).toHaveLength(1)
    expect(result.meta![0].content).toBe('page desc')
  })

  it('deduplicates meta by property (og:title)', () => {
    const result = mergeHeadDescriptors(
      { meta: [{ property: 'og:title', content: 'Root' }] },
      { meta: [{ property: 'og:title', content: 'Page' }] },
    )
    expect(result.meta).toHaveLength(1)
    expect(result.meta![0].content).toBe('Page')
  })

  it('accumulates different meta tags', () => {
    const result = mergeHeadDescriptors(
      { meta: [{ name: 'description', content: 'desc' }] },
      { meta: [{ name: 'author', content: 'test' }] },
    )
    expect(result.meta).toHaveLength(2)
  })

  it('deduplicates links by rel+href', () => {
    const result = mergeHeadDescriptors(
      { link: [{ rel: 'canonical', href: '/old' }] },
      { link: [{ rel: 'canonical', href: '/new' }] },
    )
    expect(result.link).toHaveLength(2) // different href = different key
  })

  it('merges three levels of heads', () => {
    const result = mergeHeadDescriptors(
      { title: 'App', meta: [{ name: 'viewport', content: 'width=device-width' }] },
      { title: 'Blog', meta: [{ name: 'description', content: 'Blog section' }] },
      { title: 'My Post', meta: [{ name: 'description', content: 'A specific post' }] },
    )
    expect(result.title).toBe('My Post')
    expect(result.meta).toHaveLength(2) // viewport + description
    const desc = result.meta!.find((m) => m.name === 'description')
    expect(desc!.content).toBe('A specific post')
  })

  it('skips undefined heads', () => {
    const result = mergeHeadDescriptors(
      undefined,
      { title: 'Hello' },
      undefined,
    )
    expect(result.title).toBe('Hello')
  })
})
