/**
 * Data attribute applied to server-rendered head elements.
 * The client head manager removes these on mount to prevent
 * duplicates when React 19 hoists client-rendered head tags.
 */
export const HEAD_ATTR = 'data-pareto-head'
