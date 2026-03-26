import type { ReactNode } from 'react'
import type { HeadDescriptor } from '../types'

export interface ScriptDescriptor {
  /** External script URL */
  src?: string
  /** Inline script content */
  content?: string
}

interface DocumentProps {
  head?: HeadDescriptor
  children?: ReactNode
  cssLinks?: string[]
  jsPreloads?: string[]
  /** Module scripts to inject in body (preamble + client entries) */
  scripts?: ScriptDescriptor[]
  /** Data script element for hydration (window.__ROUTE_DATA__, etc.) */
  dataScript?: ReactNode
}

/**
 * The HTML document shell rendered on the server.
 * This wraps the entire page and provides the <html> structure.
 */
export function Document({ head, children, cssLinks, jsPreloads, scripts, dataScript }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {head?.title && <title>{head.title}</title>}
        {head?.meta?.map((attrs, i) => (
          <meta key={`meta-${i}`} {...attrs} />
        ))}
        {head?.link?.map((attrs, i) => (
          <link key={`link-${i}`} {...attrs} />
        ))}
        {cssLinks?.map((href) => (
          <link key={href} rel="stylesheet" href={href} type="text/css" />
        ))}
        {jsPreloads?.map((href) => (
          <link key={href} rel="modulepreload" href={href} />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {dataScript}
        {scripts?.map((s, i) =>
          s.content ? (
            <script
              key={`script-${i}`}
              type="module"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: s.content }}
            />
          ) : (
            <script
              key={s.src}
              type="module"
              src={s.src}
              suppressHydrationWarning
            />
          ),
        )}
      </body>
    </html>
  )
}
