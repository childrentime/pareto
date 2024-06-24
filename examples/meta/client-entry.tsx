import type { ParetoPage } from '@paretojs/core'
import { PageContext } from '@paretojs/core/client'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import Meta from './shared-meta'

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById('main')!
  const __INITIAL_DATA__ = window.__INITIAL_DATA__ as Record<string, any>
  await Page.setUpClient?.()

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <Meta />
        <Page initialData={__INITIAL_DATA__} />
      </PageContext>
    </StrictMode>,
  )
}
export { startApp }
