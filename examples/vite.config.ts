import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __PARETO_TEST_VITE_CONFIG__: JSON.stringify('vite-config-works'),
  },
})
