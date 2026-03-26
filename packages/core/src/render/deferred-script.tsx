import { use } from 'react'

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
  const serialized = JSON.stringify(data)

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(function(){` +
          `var d=window.__ROUTE_DATA__;` +
          `if(!d)d=window.__ROUTE_DATA__={};` +
          `d[${JSON.stringify(dataKey)}]=${serialized};` +
          `var e=new CustomEvent("pareto:deferred",{detail:${JSON.stringify(dataKey)}});` +
          `document.dispatchEvent(e);` +
          `})()`,
      }}
    />
  )
}
