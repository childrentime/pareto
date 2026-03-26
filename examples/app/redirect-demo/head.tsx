import type { HeadDescriptor } from '@paretojs/core'

export function head(): HeadDescriptor {
  return {
    title: 'Redirect & 404 — Pareto',
    meta: [
      { name: 'description', content: 'Redirects and not-found pages in Pareto.' },
    ],
  }
}
