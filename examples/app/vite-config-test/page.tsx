declare const __PARETO_TEST_VITE_CONFIG__: string | undefined

export default function ViteConfigTestPage() {
  const value =
    typeof __PARETO_TEST_VITE_CONFIG__ !== 'undefined'
      ? __PARETO_TEST_VITE_CONFIG__
      : 'not-defined'

  return (
    <div>
      <h1>vite.config.ts Test</h1>
      <p data-testid="vite-config-value">{value}</p>
    </div>
  )
}
