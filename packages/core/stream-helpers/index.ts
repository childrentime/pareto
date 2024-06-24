import {
  promiseMap as clientPromiseMap,
  mockClientPromise,
} from './client.promise'
import { Scripts } from './scripts'
import { promiseMap as serverPromiseMap } from './server.promise'

const promiseMap =
  typeof window !== 'undefined' ? clientPromiseMap : serverPromiseMap

export { Scripts, mockClientPromise, promiseMap }
