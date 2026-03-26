// Store
export {
  defineStore,
  defineContextStore,
  createStoreApi,
} from './store'
export type { StateCreator, StoreApi } from './store'

// Types & Helpers
export { defer, DeferredData, redirect, notFound, ParetoRedirect, ParetoNotFound } from './types'
export type {
  ParetoConfig,
  LoaderContext,
  LoaderFunction,
  RouteConfig,
  NavigateOptions,
  RouterState,
  HeadDescriptor,
  HeadFunction,
  RouteManifest,
  RouteManifestEntry,
  RouteDef,
  RouteMatch,
} from './types'

// Router (client)
export { Link } from './router/link'
export { useRouter, useRouterSnapshot } from './router/use-router'
export { RouterProvider } from './router/context'

// Data
export { useLoaderData, LoaderDataContext } from './data/use-loader-data'
export { useStreamData, Await } from './data/streaming'

// Render
export { ParetoErrorBoundary } from './render/error-boundary'
export { hydrateApp, startClient } from './render/client'
export type { ClientRoute } from './render/client'

// Head
export { mergeHeadDescriptors } from './router/head-manager'
