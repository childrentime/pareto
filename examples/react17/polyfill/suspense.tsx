import type { PropsWithChildren } from 'react'
import React from 'react'

interface SuspenseProps {
  fallback: React.ReactNode
  streamKey: string
}

export const childrenMap = new Map<string, React.ReactNode>()

export function Suspense(props: PropsWithChildren<SuspenseProps>) {
  if (typeof window !== 'undefined') {
    // if we are on the client side, we can get data from window
    const data = window.__STREAM_DATA__?.[props.streamKey]

    if (React.isValidElement(props.children)) {
      return React.cloneElement(props.children, data)
    }
  }

  childrenMap.set(props.streamKey, props.children)
  // @ts-ignore
  return React.cloneElement(props.fallback, { id: props.streamKey })
}
