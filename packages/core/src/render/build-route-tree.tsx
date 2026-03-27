import type { ReactNode } from 'react'
import { Suspense } from 'react'
import { LoaderDataContext } from '../data/use-loader-data'
import { ParetoErrorBoundary } from './error-boundary'

interface RouteSegmentModule {
  component: React.ComponentType<{ children?: ReactNode }>
  loaderData?: unknown
  loading?: React.ComponentType
  error?: React.ComponentType<{ error: Error }>
}

/**
 * Build a nested React element tree from matched route segments.
 *
 * The tree is structured as:
 *   RootLayout > ... > PageLayout > Page
 *
 * Each layout wraps its children and gets its own LoaderDataContext.
 * Loading/error boundaries are inserted at each segment that defines them.
 */
export function buildRouteTree(
  layouts: RouteSegmentModule[],
  page: RouteSegmentModule,
): ReactNode {
  // Start from the page (innermost) and wrap outward with layouts
  let content: ReactNode = wrapSegment(page, null)

  // Wrap with layouts from innermost to outermost
  for (let i = layouts.length - 1; i >= 0; i--) {
    content = wrapSegment(layouts[i], content)
  }

  return content
}

function wrapSegment(
  segment: RouteSegmentModule,
  children: ReactNode | null,
): ReactNode {
  const {
    component: Component,
    loaderData,
    loading: Loading,
    error: ErrorComponent,
  } = segment

  // The component itself, with children outlet for layouts
  let element: ReactNode = children ? (
    <Component>{children}</Component>
  ) : (
    <Component />
  )

  // Wrap in LoaderDataContext so useLoaderData works for this segment
  element = (
    <LoaderDataContext.Provider value={loaderData}>
      {element}
    </LoaderDataContext.Provider>
  )

  // Wrap in Suspense if there's a loading component
  if (Loading) {
    element = <Suspense fallback={<Loading />}>{element}</Suspense>
  }

  // Wrap in error boundary if there's an error component
  if (ErrorComponent) {
    element = (
      <ParetoErrorBoundary fallback={ErrorComponent}>
        {element}
      </ParetoErrorBoundary>
    )
  }

  return element
}
