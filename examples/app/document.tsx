import type { DocumentContext } from '@paretojs/core'

export function getDocumentProps(ctx: DocumentContext) {
  const lang = ctx.params.lang || 'en'
  return {
    lang,
    dir: lang === 'ar' || lang === 'he' ? 'rtl' : 'ltr',
  }
}
