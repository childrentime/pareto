import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: process.env.CI ? 1 : '50%',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:4003',
  },
  webServer: {
    command: 'PORT=4003 npx tsx ../packages/core/src/cli/index.ts dev',
    port: 4003,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
