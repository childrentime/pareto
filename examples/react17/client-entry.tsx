import { StrictMode } from 'react'
import { hydrate } from 'react-dom'
import superjson from 'superjson'

const startApp = async (Page: any) => {
  const root = document.getElementById('main')!
  const __INITIAL_DATA__ = superjson.parse(window.__INITIAL_DATA__) as Record<
    string,
    any
  >
  await Page.setUpClient?.()

  hydrate(
    <StrictMode>
      <Page initialData={__INITIAL_DATA__} />
    </StrictMode>,
    root,
  )
}
export { startApp }
