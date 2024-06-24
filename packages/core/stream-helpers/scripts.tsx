import { Suspense } from 'react'
import { use } from '../polyfill'
import { STREAMING_SERIALIZATION_EVENT } from './constant'
import { promiseMap } from './server.promise'

export function Scripts() {
  const promises = [...promiseMap.values()]
  const keys = [...promiseMap.keys()]

  return (
    <>
      {promises.map((promise, index) => (
        <Suspense key={index} fallback={null}>
          <Script promise={promise} path={keys[index]} />
        </Suspense>
      ))}
    </>
  )
}

export function Script(props: { promise: Promise<any>; path: string }) {
  const { promise, path } = props
  const data = use(promise)
  const jsonData = JSON.stringify([path, data])

  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
              if (!window.__STREAM_DATA__) {
                window.__STREAM_DATA__ = {};
              }
              window.__STREAM_DATA__["${path}"] = ${jsonData};
              const event = new CustomEvent('${STREAMING_SERIALIZATION_EVENT}', {
                detail: '${jsonData}'
              });document.dispatchEvent(event);
            `,
      }}
    />
  )
}
