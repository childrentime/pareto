import { expect, test } from '@playwright/test'

test.describe('Environment variables', () => {
  test('server-only vars are accessible in loaders but NOT on the client', async ({
    page,
  }) => {
    await page.goto('/env-test')
    await expect(page.locator('h1')).toContainText('Env Test')

    // Server side: loader reads process.env — both PARETO_ and unprefixed
    // vars are accessible.
    await expect(page.locator('[data-testid="server-api-secret"]')).toHaveText(
      'API_SECRET: server-secret-value',
    )
    await expect(
      page.locator('[data-testid="server-database-url"]'),
    ).toHaveText('DATABASE_URL: postgresql://localhost:5432/myapp')
    await expect(
      page.locator('[data-testid="server-pareto-api-url"]'),
    ).toHaveText('PARETO_API_URL: https://api.example.com')
  })

  test('PARETO_ prefixed vars are accessible on the client', async ({
    page,
  }) => {
    await page.goto('/env-test')

    // Client side: only PARETO_ prefixed vars are inlined via import.meta.env
    await expect(page.locator('[data-testid="client-api-url"]')).toHaveText(
      'PARETO_API_URL: https://api.example.com',
    )
    await expect(page.locator('[data-testid="client-app-name"]')).toHaveText(
      'PARETO_APP_NAME: My Pareto App',
    )
  })

  test('unprefixed server-only vars are NOT exposed on the client', async ({
    page,
  }) => {
    await page.goto('/env-test')

    // Security check: unprefixed vars must NOT be visible on the client.
    // Vite's envPrefix: 'PARETO_' ensures unprefixed vars stay server-side.
    await expect(page.locator('[data-testid="client-api-secret"]')).toHaveText(
      'API_SECRET: undefined',
    )
    await expect(
      page.locator('[data-testid="client-database-url"]'),
    ).toHaveText('DATABASE_URL: undefined')
  })
})
