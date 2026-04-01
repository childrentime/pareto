import { use } from 'react'
import serialize from 'serialize-javascript'

interface DeferredScriptProps {
  dataKey: string
  promise: Promise<unknown>
}

/**
 * Server-only component that resolves a deferred promise and injects
 * a <script> tag that dispatches the resolved data to the client.
 * Used inside a <Suspense> boundary to stream data after the shell.
 */
export function DeferredScript({ dataKey, promise }: DeferredScriptProps) {
  const data = use(promise)
  const serializedKey = serialize(dataKey, { isJSON: true })
  const serializedData = serialize(data, { isJSON: true })

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html:
          `(function(){` +
          `var d=window.__ROUTE_DATA__;` +
          `if(!d)d=window.__ROUTE_DATA__={};` +
          `d[${serializedKey}]=${serializedData};` +
          `var e=new CustomEvent("pareto:deferred",{detail:${serializedKey}});` +
          `document.dispatchEvent(e);` +
          `})()`,
      }}
    />
  )
}
