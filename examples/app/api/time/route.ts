import type { LoaderContext } from '@paretojs/core'

/**
 * Resource route: no page.tsx, just loader/action.
 * GET /api/time → returns JSON.
 */
export function loader(_ctx: LoaderContext) {
  return {
    timestamp: new Date().toISOString(),
    unix: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    message: 'This is a resource route — no HTML, just JSON.',
  }
}
