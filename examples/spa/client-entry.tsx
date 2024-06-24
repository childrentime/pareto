import type { ParetoPage } from '@paretojs/core'
import { PageContext } from '@paretojs/core/client'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

const url = new URL(window.location.href)
const __csr = !!url.searchParams.get('__csr')

const startApp = async (Page: ParetoPage) => {
  const root = document.getElementById('main')!
  await Page.setUpClient?.()
  const __INITIAL_DATA__ = window.__INITIAL_DATA__ as Record<string, any>

  if (__csr) {
    createRoot(root).render(
      <StrictMode>
        <PageContext>
          <Page initialData={__INITIAL_DATA__} />
        </PageContext>
      </StrictMode>,
    )
    return
  }

  hydrateRoot(
    root,
    <StrictMode>
      <PageContext>
        <Page initialData={__INITIAL_DATA__} />
      </PageContext>
    </StrictMode>,
  )
}
export { startApp }
