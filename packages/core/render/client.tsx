import type { PropsWithChildren } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import type { InsertCss } from '../useStyles'
import { StyleContext } from '../useStyles'
import { IS_REACT_19 } from '../utils/env'

const insertCss: InsertCss = styles => {
  const removeCss = styles.map(style => style._insertCss())
  return () => removeCss.forEach(dispose => dispose())
}

export const PageContext = (props: PropsWithChildren<unknown>) => {
  const StyleProvider = IS_REACT_19 ? StyleContext : StyleContext.Provider

  return (
    <HelmetProvider>
      {/* @ts-ignore react19 */}
      <StyleProvider value={{ insertCss }}>{props.children}</StyleProvider>
    </HelmetProvider>
  )
}
