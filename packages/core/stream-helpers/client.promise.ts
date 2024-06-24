import { STREAMING_SERIALIZATION_EVENT } from './constant'

export const promiseMap = new Map<string, Promise<unknown>>()

export const mockClientPromise = (key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  promiseMap.set(key, new Promise(() => {}))
}

if (typeof window !== 'undefined') {
  document.addEventListener(STREAMING_SERIALIZATION_EVENT, event => {
    const { detail: data } = event as CustomEvent
    const [key, value] = JSON.parse(data as string) as [string, unknown]
    promiseMap.set(key, Promise.resolve(value))
  })
}
