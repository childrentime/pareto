import type { Request, Response, NextFunction } from 'express'

/**
 * Default security headers middleware.
 *
 * Sets baseline headers recommended by OWASP for all HTML responses.
 * Users can override any header via a custom `app.ts` with their own
 * middleware.
 */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME-type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // Prevent clickjacking — allow same origin only
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')

    // Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Opt out of FLoC / Topics API tracking
    res.setHeader('Permissions-Policy', 'interest-cohort=()')

    // XSS protection for legacy browsers
    res.setHeader('X-XSS-Protection', '1; mode=block')

    // Prevent DNS prefetch leaks
    res.setHeader('X-DNS-Prefetch-Control', 'off')

    next()
  }
}
