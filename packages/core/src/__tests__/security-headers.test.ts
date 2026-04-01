import { describe, expect, it, vi } from 'vitest'
import { SECURITY_HEADERS, securityHeaders } from '../server/security-headers'

function createMockReqRes() {
  const headers: Record<string, string> = {}
  const req = {} as any
  const res = {
    setHeader: vi.fn((key: string, value: string) => {
      headers[key] = value
    }),
  } as any
  const next = vi.fn()
  return { req, res, next, headers }
}

describe('securityHeaders', () => {
  it('should return a middleware function', () => {
    const middleware = securityHeaders()
    expect(typeof middleware).toBe('function')
  })

  it('should set X-Content-Type-Options', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Content-Type-Options',
      'nosniff',
    )
  })

  it('should set X-Frame-Options', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN')
  })

  it('should set Referrer-Policy', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    )
  })

  it('should set Permissions-Policy with modern directives', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    )
  })

  it('should set X-DNS-Prefetch-Control', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off')
  })

  it('should set Strict-Transport-Security', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    )
  })

  it('should set Cross-Origin-Opener-Policy', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Opener-Policy',
      'same-origin',
    )
  })

  it('should call next()', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('should set all defined headers', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledTimes(SECURITY_HEADERS.length)
  })

  it('should not include obsolete X-XSS-Protection', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    const calls = res.setHeader.mock.calls.map((c: [string, string]) => c[0])
    expect(calls).not.toContain('X-XSS-Protection')
  })

  it('should not include obsolete interest-cohort', () => {
    const headerValues = SECURITY_HEADERS.map(([, v]) => v)
    expect(headerValues.every(v => !v.includes('interest-cohort'))).toBe(true)
  })
})
