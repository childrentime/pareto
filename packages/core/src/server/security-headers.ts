import type { NextFunction, Request, Response } from 'express'

/**
 * Baseline security headers recommended by OWASP.
 * Single source of truth used by both the dev middleware and the generated production server.
 *
 * - X-Content-Type-Options: prevents MIME-type sniffing
 * - X-Frame-Options: clickjacking protection (superseded by CSP frame-ancestors but still useful for older browsers)
 * - Referrer-Policy: limits referrer info sent to other origins
 * - Permissions-Policy: disables browser features not needed by default
 * - X-DNS-Prefetch-Control: prevents speculative DNS resolution
 * - Strict-Transport-Security: enforces HTTPS for 1 year (only effective when served over HTTPS)
 * - Cross-Origin-Opener-Policy: isolates browsing context for Spectre mitigation
 */
export const SECURITY_HEADERS: [string, string][] = [
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'SAMEORIGIN'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin'],
  ['Permissions-Policy', 'camera=(), microphone=(), geolocation=()'],
  ['X-DNS-Prefetch-Control', 'off'],
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains'],
  ['Cross-Origin-Opener-Policy', 'same-origin'],
]

/**
 * Default security headers middleware.
 *
 * Sets baseline headers recommended by OWASP for all HTML responses.
 * Users can override any header via a custom `app.ts` with their own
 * middleware.
 */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    for (const [name, value] of SECURITY_HEADERS) {
      res.setHeader(name, value)
    }
    next()
  }
}
