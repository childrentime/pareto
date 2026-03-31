import type { ReactNode } from 'react'
import type { HtmlAttributes } from '../types'

export interface ScriptDescriptor {
  /** External script URL */
  src?: string
  /** Inline script content */
  content?: string
}

/**
 * 200+ zero-width spaces (\u200b) that count toward WebKit's
 * `visualCharacterThreshold` (200 visible chars) without producing
 * any visible output. Forces WKWebView to flush its rendering buffer
 * and paint the initial shell immediately.
 */
const WK_FLUSH_CHARS = '\u200b'.repeat(220)

interface DocumentProps {
  /** Head elements rendered by the route's Head component */
  headContent?: ReactNode
  children?: ReactNode
  cssLinks?: string[]
  jsPreloads?: string[]
  /** Module scripts to inject in body (preamble + client entries) */
  scripts?: ScriptDescriptor[]
  /** Data script element for hydration (window.__ROUTE_DATA__, etc.) */
  dataScript?: ReactNode
  /** Attributes to apply to the <html> element (from app/document.tsx) */
  htmlAttributes?: HtmlAttributes
  /** @see ParetoConfig.wkWebViewFlushHint */
  wkWebViewFlushHint?: boolean
}

/**
 * The HTML document shell rendered on the server.
 * This wraps the entire page and provides the <html> structure.
 */
export function Document({
  headContent,
  children,
  cssLinks,
  jsPreloads,
  scripts,
  dataScript,
  htmlAttributes = {},
  wkWebViewFlushHint = false,
}: DocumentProps) {
  const { className, ...rest } = htmlAttributes
  return (
    <html {...rest} className={className} suppressHydrationWarning>
      <head>
        {headContent}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {cssLinks?.map(href => (
          <link key={href} rel="stylesheet" href={href} type="text/css" />
        ))}
        {jsPreloads?.map(href => (
          <link key={href} rel="modulepreload" href={href} />
        ))}
      </head>
      <body>
        {wkWebViewFlushHint && (
          <div
            aria-hidden="true"
            style={{ height: 0, width: 0, overflow: 'hidden' }}
          >
            {WK_FLUSH_CHARS}
          </div>
        )}
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
