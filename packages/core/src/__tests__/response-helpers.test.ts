import { describe, it, expect } from 'vitest'
import { ParetoRedirect, ParetoNotFound } from '../types'

describe('ParetoRedirect', () => {
  it('should create a redirect with default 302 status', () => {
    const r = new ParetoRedirect('/login')
    expect(r.url).toBe('/login')
    expect(r.status).toBe(302)
  })

  it('should create a redirect with custom status', () => {
    const r = new ParetoRedirect('/new-url', 301)
    expect(r.url).toBe('/new-url')
    expect(r.status).toBe(301)
  })

  it('redirect() should throw ParetoRedirect', () => {
    // Import dynamically to avoid the throw at module level
    expect(() => {
      throw new ParetoRedirect('/login')
    }).toThrow(ParetoRedirect)
  })

  it('should be detectable with instanceof', () => {
    const r = new ParetoRedirect('/test')
    expect(r instanceof ParetoRedirect).toBe(true)
    expect(r instanceof ParetoNotFound).toBe(false)
  })
})

describe('ParetoNotFound', () => {
  it('should create a not-found instance', () => {
    const nf = new ParetoNotFound()
    expect(nf instanceof ParetoNotFound).toBe(true)
  })

  it('notFound() should throw ParetoNotFound', () => {
    expect(() => {
      throw new ParetoNotFound()
    }).toThrow(ParetoNotFound)
  })

  it('should be distinguishable from ParetoRedirect', () => {
    const nf = new ParetoNotFound()
    expect(nf instanceof ParetoRedirect).toBe(false)
  })
})
