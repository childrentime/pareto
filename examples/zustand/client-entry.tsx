import type { ParetoPage } from '@paretojs/core'
import { PageContext } from '@paretojs/core/client'
import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { ZustandProvider } from './lib/zustand'

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById('main')!
  const __INITIAL_DATA__ = window.__INITIAL_DATA__ as Record<string, any>
  const store = await Page.setUpClient?.(__INITIAL_DATA__)

  hydrateRoot(
    root,
    <StrictMode>
      <ZustandProvider value={store}>
        <PageContext>
          <Page initialData={__INITIAL_DATA__} />
        </PageContext>
      </ZustandProvider>
    </StrictMode>,
  )
}
export { startApp }
