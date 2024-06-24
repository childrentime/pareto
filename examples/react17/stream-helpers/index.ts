import {
  promiseMap as clientPromiseMap,
  mockClientPromise,
} from './client.promise'
import { promiseMap as serverPromiseMap } from './server.promise'

const promiseMap =
  typeof window !== 'undefined' ? clientPromiseMap : serverPromiseMap

export { mockClientPromise, promiseMap }
