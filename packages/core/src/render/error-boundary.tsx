import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

interface Props {
  fallback: React.ComponentType<{ error: Error }>
  children?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Error boundary component for catching render errors.
 * Use it in your layouts or pages to handle errors locally.
 *
 * @example
 * ```tsx
 * import { ParetoErrorBoundary } from '@paretojs/core'
 *
 * function MyPage() {
 *   return (
 *     <ParetoErrorBoundary fallback={({ error }) => <p>{error.message}</p>}>
 *       <RiskyComponent />
 *     </ParetoErrorBoundary>
 *   )
 * }
 * ```
 */
export class ParetoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Pareto route error:', error, info)
  }

  render() {
    if (this.state.error) {
      const Fallback = this.props.fallback
      return <Fallback error={this.state.error} />
    }
    return this.props.children
  }
}
