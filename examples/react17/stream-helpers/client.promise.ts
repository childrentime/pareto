import { STREAMING_SERIALIZATION_EVENT } from './constant'

export const promiseMap = new Map<string, Promise<any>>()

export const mockClientPromise = (key: string) => {
  promiseMap.set(key, new Promise(() => {}))
}

if (typeof window !== 'undefined') {
  document.addEventListener(STREAMING_SERIALIZATION_EVENT, event => {
    const { detail: data } = event as CustomEvent
    const [key, value] = JSON.parse(data)
    promiseMap.set(key, Promise.resolve(value))
  })
}
