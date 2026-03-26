import { describe, it, expect, vi } from 'vitest'
import { securityHeaders } from '../server/security-headers'

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
    expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
  })

  it('should set X-Frame-Options', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN')
  })

  it('should set Referrer-Policy', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin')
  })

  it('should set Permissions-Policy', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'interest-cohort=()')
  })

  it('should set X-XSS-Protection', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block')
  })

  it('should set X-DNS-Prefetch-Control', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledWith('X-DNS-Prefetch-Control', 'off')
  })

  it('should call next()', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('should set exactly 6 headers', () => {
    const { req, res, next } = createMockReqRes()
    securityHeaders()(req, res, next)
    expect(res.setHeader).toHaveBeenCalledTimes(6)
  })
})
