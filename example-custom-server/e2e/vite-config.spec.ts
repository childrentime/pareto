import { expect, test } from '@playwright/test'

test.describe('vite.config.ts integration (custom server)', () => {
  test('user vite.config.ts define is applied in dev mode', async ({
    page,
  }) => {
    await page.goto('/vite-config-test')
    await expect(page.locator('h1')).toContainText('vite.config.ts Test')

    const value = page.locator('[data-testid="vite-config-value"]')
    await expect(value).toHaveText('vite-config-works')
  })
})
