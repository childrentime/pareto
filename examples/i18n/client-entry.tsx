import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { ParetoPage } from '@paretojs/core'
import { PageContext } from '@paretojs/core/client'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { initLinguiClient } from './i18n'

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById('main')!
  const __INITIAL_DATA__ = window.__INITIAL_DATA__ as Record<string, any>
  initLinguiClient()

  await Page.setUpClient?.()

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <I18nProvider i18n={i18n}>
          <Page initialData={__INITIAL_DATA__} />
        </I18nProvider>
      </PageContext>
    </StrictMode>,
  )
}
export { startApp }
