import { describe, expect, it } from 'vitest'
import { normalizePath, pathToRegex } from '../router/route-matcher'

describe('client route matching utilities', () => {
  describe('pathToRegex', () => {
    it('matches static paths', () => {
      const regex = pathToRegex('/about')
      expect(regex.test('/about')).toBe(true)
      expect(regex.test('/about/')).toBe(true)
      expect(regex.test('/other')).toBe(false)
    })

    it('matches dynamic segments', () => {
      const regex = pathToRegex('/blog/:slug')
      expect(regex.test('/blog/hello')).toBe(true)
      expect(regex.test('/blog/123')).toBe(true)
      expect(regex.test('/blog/')).toBe(false)
      expect(regex.test('/blog/a/b')).toBe(false)
    })

    it('matches catch-all segments', () => {
      const regex = pathToRegex('/docs/:path*')
      expect(regex.test('/docs/a')).toBe(true)
      expect(regex.test('/docs/a/b/c')).toBe(true)
      expect(regex.test('/docs/')).toBe(false)
    })

    it('matches root path', () => {
      const regex = pathToRegex('/')
      expect(regex.test('/')).toBe(true)
    })
  })

  describe('normalizePath', () => {
    it('strips trailing slash', () => {
      expect(normalizePath('/about/')).toBe('/about')
    })

    it('preserves root slash', () => {
      expect(normalizePath('/')).toBe('/')
    })

    it('adds leading slash when missing', () => {
      expect(normalizePath('about')).toBe('/about')
    })

    it('keeps normal paths unchanged', () => {
      expect(normalizePath('/about')).toBe('/about')
    })
  })
})
