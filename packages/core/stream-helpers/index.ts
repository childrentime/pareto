import { promiseMap as serverPromiseMap } from "./server.promise";
import {
  promiseMap as clientPromiseMap,
  mockClientPromise,
} from "./client.promise";
import { Scripts } from "./scripts";

const promiseMap =
  typeof window !== "undefined" ? clientPromiseMap : serverPromiseMap;

export { promiseMap, Scripts, mockClientPromise };
