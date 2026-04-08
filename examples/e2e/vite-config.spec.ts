import { expect, test } from '@playwright/test'

test.describe('vite.config.ts integration', () => {
  test('user vite.config.ts define is applied in dev mode', async ({
    page,
  }) => {
    await page.goto('/vite-config-test')
    await expect(page.locator('h1')).toContainText('vite.config.ts Test')

    // __PARETO_TEST_VITE_CONFIG__ is defined in the user's vite.config.ts.
    // Vite auto-loads it and merges with Pareto's internal config.
    const value = page.locator('[data-testid="vite-config-value"]')
    await expect(value).toHaveText('vite-config-works')
  })
})
