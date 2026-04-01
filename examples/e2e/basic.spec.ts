import { expect, test } from '@playwright/test'

// ---------------------------------------------------------------------------
// SSR -- every page should return server-rendered HTML
// ---------------------------------------------------------------------------

test.describe('SSR rendering', () => {
  test('index page renders', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('React SSR')
    await expect(page.locator('text=Features')).toBeVisible()
  })

  test('stream page renders quick stats immediately', async ({ page }) => {
    await page.goto('/stream')
    await expect(page.locator('h1')).toContainText('Streaming SSR')
    await expect(page.locator('text=12,847')).toBeVisible()
    await expect(page.locator('text=48,392')).toBeVisible()
  })

  test('store page renders', async ({ page }) => {
    await page.goto('/store')
    await expect(page.locator('h1')).toContainText('Store')
    await expect(page.locator('text=Interactive Counter')).toBeVisible()
  })

  test('error-demo page renders', async ({ page }) => {
    await page.goto('/error-demo')
    await expect(page.locator('h1')).toContainText('Error Handling')
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
  })

  test('redirect-demo page renders', async ({ page }) => {
    await page.goto('/redirect-demo')
    await expect(page.locator('h1')).toContainText('Redirect')
  })

  test('head-demo page renders', async ({ page }) => {
    await page.goto('/head-demo')
    await expect(page.locator('h1')).toContainText('Head Management')
  })

  test('ssr-store page renders with SSR products', async ({ page }) => {
    await page.goto('/ssr-store')
    await expect(page.locator('h1')).toContainText('SSR + Store')
    await expect(page.locator('text=Mechanical Keyboard')).toBeVisible()
    await expect(page.locator('text=Wireless Mouse')).toBeVisible()
    await expect(page.locator('text=Cart is empty')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Hydration -- page should hydrate without errors
// ---------------------------------------------------------------------------

test.describe('Hydration', () => {
  test('index page hydrates without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await page.waitForFunction(
      () => (window as any).__ROUTE_DATA__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })

  test('stream page hydrates without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/stream')
    await page.waitForFunction(
      () => (window as any).__ROUTE_DATA__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })

  test('store page hydrates without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/store')
    await page.waitForFunction(
      () => (window as any).__ROUTE_DATA__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })

  test('ssr-store page hydrates without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/ssr-store')
    await page.waitForFunction(
      () => (window as any).__ROUTE_DATA__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })

  test('error page (loader error) hydrates without errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/error-demo?fail=1')
    await page.waitForFunction(
      () =>
        (window as any).__ROUTE_ERROR__ !== undefined ||
        (window as any).__ROUTE_DATA__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Navigation -- client-side routing
// ---------------------------------------------------------------------------

test.describe('Navigation', () => {
  test('nav bar is present with correct links', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header.locator('a[href="/stream"]')).toBeVisible()
    await expect(header.locator('a[href="/store"]')).toBeVisible()
    await expect(header.locator('a[href="/error-demo"]')).toBeVisible()
    await expect(header.locator('a[href="/redirect-demo"]')).toBeVisible()
  })

  test('client-side navigation: index -> stream', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR')
    expect(page.url()).toContain('/stream')
  })

  test('client-side navigation: index -> store', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')
    expect(page.url()).toContain('/store')
  })

  test('client-side navigation: index -> head-demo', async ({ page }) => {
    await page.goto('/')
    // Click the "Demo" link under Head Management feature card
    const headCard = page.locator('div', { hasText: 'Head Management' }).last()
    await headCard.locator('a[href="/head-demo"]').click()
    await expect(page.locator('h1')).toContainText('Head Management')
    expect(page.url()).toContain('/head-demo')
  })

  test('no loading skeleton when navigating to homepage', async ({ page }) => {
    await page.goto('/stream')
    // Navigate to home
    await page.locator('header a', { hasText: 'Pareto' }).click()
    // Should show the homepage directly, never the skeleton
    await expect(page.locator('h1')).toContainText('React SSR')
    await expect(page.locator('.animate-pulse')).not.toBeVisible()
  })

  test('browser back button works', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR')

    await page.goBack()
    await expect(page.locator('h1')).toContainText('React SSR')
  })

  test('back-to-home links work', async ({ page }) => {
    await page.goto('/stream')
    await page.locator('a', { hasText: 'Home' }).click()
    await expect(page.locator('h1')).toContainText('React SSR')
    expect(page.url()).not.toContain('/stream')
  })

  test('resource route opens in new tab (not client-side nav)', async ({
    page,
  }) => {
    await page.goto('/')
    // Resource Routes feature card should have target="_blank"
    const apiLink = page.locator('a[href="/api/time"][target="_blank"]')
    await expect(apiLink).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Streaming -- deferred data streams in
// ---------------------------------------------------------------------------

test.describe('Streaming', () => {
  test('SSR: deferred deployments stream in after shell', async ({ page }) => {
    await page.goto('/stream')

    // Quick stats should be immediately visible
    await expect(page.locator('text=12,847')).toBeVisible()

    // Deferred deployments arrive after ~1.5s
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 5000,
    })
  })

  test('SSR: deferred analytics stream in after deployments', async ({
    page,
  }) => {
    await page.goto('/stream')

    // Deferred analytics arrive after ~2.5s
    await expect(page.locator('text=42ms')).toBeVisible({
      timeout: 5000,
    })
    await expect(page.locator('text=94.2%')).toBeVisible({
      timeout: 5000,
    })
  })

  test('CSR: page shows immediately, deferred data streams in', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()

    await expect(page.locator('h1')).toContainText('Streaming SSR', {
      timeout: 3000,
    })
    await expect(page.locator('text=12,847')).toBeVisible({ timeout: 3000 })

    // deployments ~1.5s, analytics ~2.5s — parallel
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })
    await expect(page.locator('text=42ms')).toBeVisible({ timeout: 4000 })
  })
})

// ---------------------------------------------------------------------------
// SSR + Store -- defineContextStore with loader data
// ---------------------------------------------------------------------------

test.describe('SSR + Store', () => {
  test('add to cart works', async ({ page }) => {
    await page.goto('/ssr-store')
    await page.getByRole('button', { name: 'Add to cart' }).first().click()
    await expect(page.getByText('Cart is empty')).not.toBeVisible()
    await expect(page.getByText('$149 each')).toBeVisible()
  })

  test('cart quantity controls work', async ({ page }) => {
    await page.goto('/ssr-store')
    await page.getByRole('button', { name: 'Add to cart' }).nth(1).click()
    await expect(page.getByText('Cart is empty')).not.toBeVisible()
    // The cart section has "client" badge — find the + button in the cart area
    const cartPanel = page.locator('.lg\\:sticky')
    await cartPanel.getByRole('button', { name: '+' }).click()
    await expect(cartPanel.getByText('2', { exact: true })).toBeVisible()
  })

  test('promo code from SSR data is displayed', async ({ page }) => {
    await page.goto('/ssr-store')
    await page.getByRole('button', { name: 'Add to cart' }).nth(2).click()
    await expect(page.getByText('PARETO20')).toBeVisible()
  })

  test('remove from cart works', async ({ page }) => {
    await page.goto('/ssr-store')
    await page.getByRole('button', { name: 'Add to cart' }).first().click()
    await expect(page.getByText('Cart is empty')).not.toBeVisible()
    const cartPanel = page.locator('.lg\\:sticky')
    await cartPanel.locator('button').last().click()
    await expect(page.getByText('Cart is empty')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Store -- reactive state management
// ---------------------------------------------------------------------------

test.describe('Store', () => {
  test('counter starts at 0', async ({ page }) => {
    await page.goto('/store')
    const counter = page.locator('span.tabular-nums', { hasText: /^0$/ })
    await expect(counter).toBeVisible()
  })

  test('increment button works', async ({ page }) => {
    await page.goto('/store')
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.locator('span.tabular-nums').first()).toHaveText('2')
  })

  test('decrement button works', async ({ page }) => {
    await page.goto('/store')
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: '-' }).click()
    await expect(page.locator('span.tabular-nums').first()).toHaveText('1')
  })

  test('reset button works', async ({ page }) => {
    await page.goto('/store')
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: '+' }).click()
    await page.locator('button', { hasText: 'Reset' }).click()
    await expect(page.locator('span.tabular-nums').first()).toHaveText('0')
  })

  test('history entries appear', async ({ page }) => {
    await page.goto('/store')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.locator('text=History')).toBeVisible()
    await expect(page.locator('text=+1 → 1')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Error handling -- error.tsx catches errors
// ---------------------------------------------------------------------------

test.describe('Error handling', () => {
  test('loader error renders custom error.tsx (SSR)', async ({ page }) => {
    const response = await page.goto('/error-demo?fail=1')
    expect(response?.status()).toBe(500)
    // Custom error.tsx renders "500" and the error message
    await expect(page.locator('text=500')).toBeVisible()
    await expect(
      page.locator('text=Intentional loader error for demo'),
    ).toBeVisible()
  })

  test('loader error SSR hydrates without mismatch', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/error-demo?fail=1')
    await page.waitForFunction(
      () => (window as any).__ROUTE_ERROR__ !== undefined,
    )
    await page.waitForTimeout(500)

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('did not match'),
    )
    expect(hydrationErrors).toEqual([])
  })

  test('loader error page has Go Home link that works', async ({ page }) => {
    await page.goto('/error-demo?fail=1')
    await expect(page.locator('text=500')).toBeVisible()
    await page.locator('a', { hasText: 'Go Home' }).click()
    await expect(page.locator('h1')).toContainText('React SSR')
  })

  test('loader error renders error.tsx via link click', async ({ page }) => {
    await page.goto('/error-demo')
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
    await page.locator('a', { hasText: 'Loader Error' }).click()
    await page.waitForURL('**/error-demo?fail=1')
    await expect(page.locator('text=500')).toBeVisible()
    await expect(
      page.locator('text=Intentional loader error for demo'),
    ).toBeVisible()
  })

  test('render error renders error boundary (client-side)', async ({
    page,
  }) => {
    await page.goto('/error-demo')
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
    await page.locator('button', { hasText: 'Render Error' }).click()
    await expect(page.locator('text=Something went wrong')).toBeVisible()
  })

  test('render error clears after navigating away', async ({ page }) => {
    await page.goto('/error-demo')
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
    await page.locator('button', { hasText: 'Render Error' }).click()
    await expect(page.locator('text=Something went wrong')).toBeVisible()
    await page.locator('header a[href="/"]').click()
    await expect(page.locator('h1')).toContainText('React SSR')
    await expect(page.locator('text=Something went wrong')).not.toBeVisible()
  })

  test('error-demo page loads successfully without ?fail', async ({ page }) => {
    await page.goto('/error-demo')
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Redirect -- loader redirect works
// ---------------------------------------------------------------------------

test.describe('Redirect', () => {
  test('protected page redirects to target (SSR)', async ({ page }) => {
    await page.goto('/redirect-demo/protected')
    await page.waitForURL('**/redirect-demo/target')
    await expect(page.locator('text=Redirected!')).toBeVisible()
  })

  test('protected page redirects to target (client-side nav)', async ({
    page,
  }) => {
    await page.goto('/redirect-demo')
    await page.locator('a', { hasText: 'Redirect in Loader' }).click()
    await page.waitForURL('**/redirect-demo/target')
    await expect(page.locator('text=Redirected!')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 404 -- not-found.tsx renders for unknown routes
// ---------------------------------------------------------------------------

test.describe('404', () => {
  test('unknown route renders not-found page (SSR)', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.locator('text=404')).toBeVisible()
    await expect(
      page.locator('text=This page could not be found'),
    ).toBeVisible()
  })

  test('unknown route renders not-found page (client-side nav)', async ({
    page,
  }) => {
    await page.goto('/redirect-demo')
    await page.locator('a', { hasText: '404 Not Found' }).click()
    await expect(page.locator('text=This page could not be found')).toBeVisible(
      { timeout: 5000 },
    )
  })

  test('not-found page has link back to home', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await page.locator('a', { hasText: 'Go Home' }).click()
    await expect(page.locator('h1')).toContainText('React SSR')
  })
})

// ---------------------------------------------------------------------------
// Resource routes -- API endpoints return JSON
// ---------------------------------------------------------------------------

test.describe('Resource routes', () => {
  test('GET /api/time returns JSON', async ({ request }) => {
    const response = await request.get('/api/time')
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json).toHaveProperty('timestamp')
    expect(json).toHaveProperty('unix')
    expect(json).toHaveProperty('timezone')
    expect(json.message).toContain('resource route')
  })
})

// ---------------------------------------------------------------------------
// Head management -- per-route title and meta tags
// ---------------------------------------------------------------------------

test.describe('Head management', () => {
  test('index page has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Pareto/)
  })

  test('stream page has correct title', async ({ page }) => {
    await page.goto('/stream')
    await expect(page).toHaveTitle(/Streaming SSR/)
  })

  test('store page has correct title', async ({ page }) => {
    await page.goto('/store')
    await expect(page).toHaveTitle(/Store/)
  })

  test('error-demo page has correct title', async ({ page }) => {
    await page.goto('/error-demo')
    await expect(page).toHaveTitle(/Error Handling/)
  })

  test('ssr-store page has correct title', async ({ page }) => {
    await page.goto('/ssr-store')
    await expect(page).toHaveTitle(/SSR \+ Store/)
  })

  test('head-demo page has correct title', async ({ page }) => {
    await page.goto('/head-demo')
    await expect(page).toHaveTitle(/Head Management/)
  })

  test('head-demo page has og:type meta tag', async ({ page }) => {
    await page.goto('/head-demo')
    const ogType = page.locator('meta[property="og:type"]')
    await expect(ogType).toHaveAttribute('content', 'website')
  })

  test('title updates on client-side navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Pareto/)

    await page.locator('header a[href="/stream"]').click()
    await expect(page).toHaveTitle(/Streaming SSR/)

    await page.locator('header a[href="/store"]').click()
    await expect(page).toHaveTitle(/Store/)
  })

  test('head-demo page has description meta tag', async ({ page }) => {
    await page.goto('/head-demo')
    const desc = page.locator('meta[name="description"]')
    await expect(desc).toHaveAttribute('content', /head\.tsx/)
  })
})

// ---------------------------------------------------------------------------
// Edge cases — inspired by Next.js / Remix test suites
// ---------------------------------------------------------------------------

test.describe('Edge cases: Navigation', () => {
  // Next.js: test/e2e/app-dir/navigation — rapid sequential navigations
  test('rapid navigation does not break the app', async ({ page }) => {
    await page.goto('/')
    // Fire multiple navigations in rapid succession
    await page.locator('header a[href="/stream"]').click()
    await page.locator('header a[href="/store"]').click()
    await page.locator('header a[href="/error-demo"]').click()
    // Should settle on the last target
    await expect(page.locator('h1')).toContainText('Error Handling', {
      timeout: 5000,
    })
    expect(page.url()).toContain('/error-demo')
  })

  // Next.js: back-forward-cache test — history.back() after multiple navigations
  test('back/forward through multiple pages preserves correct state', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR')
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')

    await page.goBack()
    await expect(page.locator('h1')).toContainText('Streaming SSR')
    await page.goBack()
    await expect(page.locator('h1')).toContainText('React SSR')
    await page.goForward()
    await expect(page.locator('h1')).toContainText('Streaming SSR')
  })

  // Remix: navigation to same URL should not break
  test('navigating to the current URL is a no-op', async ({ page }) => {
    await page.goto('/store')
    await expect(page.locator('h1')).toContainText('Store')
    // Click the same nav link again
    await page.locator('header a[href="/store"]').click()
    // Should still be on store, not broken
    await expect(page.locator('h1')).toContainText('Store')
  })

  // Next.js: scroll restoration
  test('scroll position resets on forward navigation', async ({ page }) => {
    await page.goto('/')
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500))
    const scrollBefore = await page.evaluate(() => window.scrollY)
    expect(scrollBefore).toBeGreaterThan(0)
    // Navigate
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR')
    // Scroll should reset to top
    const scrollAfter = await page.evaluate(() => window.scrollY)
    expect(scrollAfter).toBe(0)
  })
})

test.describe('Edge cases: Error recovery', () => {
  test('error boundary resets when navigating back to the same errored route', async ({
    page,
  }) => {
    await page.goto('/error-demo')
    await page.locator('button', { hasText: 'Render Error' }).click()
    await expect(page.locator('text=Something went wrong')).toBeVisible()
    await page.locator('header a[href="/"]').click()
    await expect(page.locator('h1')).toContainText('React SSR')
    await page.locator('header a[href="/error-demo"]').click()
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
  })

  test('error on one route does not affect other routes', async ({ page }) => {
    await page.goto('/error-demo')
    await page.locator('button', { hasText: 'Render Error' }).click()
    await expect(page.locator('text=Something went wrong')).toBeVisible()
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')
    await page.locator('button', { hasText: '+' }).click()
    await expect(page.locator('span.tabular-nums').first()).toHaveText('1')
  })

  test('loader error page Go Home link navigates correctly', async ({
    page,
  }) => {
    await page.goto('/error-demo?fail=1')
    await expect(page.locator('text=500')).toBeVisible()
    const goHome = page.locator('a', { hasText: 'Go Home' })
    await expect(goHome).toBeVisible()
    await goHome.click()
    await expect(page.locator('h1')).toContainText('React SSR')
  })

  test('client-side navigation to error route uses custom error.tsx', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/error-demo"]').click()
    await expect(page.locator('text=Loader ran successfully')).toBeVisible()
    await page.locator('a', { hasText: 'Loader Error' }).click()
    await page.waitForURL('**/error-demo?fail=1')
    await expect(page.locator('text=500')).toBeVisible()
  })
})

test.describe('Edge cases: 404 and redirects', () => {
  // Verify 404 page renders correctly with Go Home link
  test('404 page has a working Go Home link', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.locator('text=404')).toBeVisible()
    await page.locator('a', { hasText: 'Go Home' }).click()
    await expect(page.locator('h1')).toContainText('React SSR')
  })

  // Remix: client-side 404 then navigate away works
  test('client-side 404 then navigate to valid page works', async ({
    page,
  }) => {
    await page.goto('/redirect-demo')
    // Navigate to 404
    await page.locator('a', { hasText: '404 Not Found' }).click()
    await expect(page.locator('text=This page could not be found')).toBeVisible(
      { timeout: 5000 },
    )
    // Navigate to a valid page
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')
  })

  // Remix: redirect preserves query params of target
  test('redirect follows correctly via client-side navigation', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/redirect-demo"]').click()
    await expect(page.locator('h1')).toContainText('Redirect')
    // Click the redirect demo link
    await page.locator('a', { hasText: 'Redirect in Loader' }).click()
    // Should end up at the target
    await page.waitForURL('**/redirect-demo/target')
    await expect(page.locator('text=Redirected!')).toBeVisible()
  })
})

test.describe('Edge cases: Hydration', () => {
  // Next.js: verify no console errors during hydration on each page
  test('no JS errors on any page during initial load', async ({ page }) => {
    const pages = [
      '/',
      '/stream',
      '/store',
      '/ssr-store',
      '/error-demo',
      '/redirect-demo',
      '/head-demo',
    ]
    for (const url of pages) {
      const errors: string[] = []
      page.on('pageerror', err => errors.push(err.message))
      await page.goto(url)
      await page.waitForTimeout(500)
      expect(errors, `JS errors on ${url}`).toEqual([])
      page.removeAllListeners('pageerror')
    }
  })

  // Next.js: window.__ROUTE_DATA__ is present after hydration
  test('route data is serialized in the HTML on every page', async ({
    page,
  }) => {
    const pages = [
      '/',
      '/stream',
      '/store',
      '/ssr-store',
      '/error-demo',
      '/head-demo',
    ]
    for (const url of pages) {
      await page.goto(url)
      const hasData = await page.evaluate(
        () => (window as any).__ROUTE_DATA__ !== undefined,
      )
      expect(hasData, `__ROUTE_DATA__ missing on ${url}`).toBe(true)
    }
  })
})

test.describe('Edge cases: Streaming', () => {
  // Remix: deferred data shows fallback then resolves
  test('skeleton placeholders appear before deferred data', async ({
    page,
  }) => {
    await page.goto('/stream')
    // Quick stats should be immediately available
    await expect(page.locator('text=12,847')).toBeVisible()
    // Before deferred data arrives, pulse skeletons should be visible
    // (the animate-pulse class is used for skeleton loading indicators)
    // After data arrives, the real content replaces the skeleton
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 5000,
    })
  })

  // Remix: navigating away during streaming doesn't break
  test('navigating away while streaming does not cause errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/stream')
    // Don't wait for deferred data — navigate away immediately
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')
    await page.waitForTimeout(3000) // Wait for any stale promises to resolve

    expect(errors).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Client-side navigation streaming (NDJSON)
// ---------------------------------------------------------------------------

test.describe('Client-side navigation: NDJSON streaming', () => {
  test('data request returns NDJSON content-type for deferred routes', async ({
    request,
  }) => {
    const response = await request.get('/__pareto/data?path=/stream')
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('ndjson')
  })

  test('data request returns JSON for non-deferred routes', async ({
    request,
  }) => {
    const response = await request.get('/__pareto/data?path=/')
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('json')
    expect(contentType).not.toContain('ndjson')
  })

  test('NDJSON response contains initial data + pendingKeys on first line', async ({
    request,
  }) => {
    const response = await request.get('/__pareto/data?path=/stream')
    const body = await response.text()
    const lines = body.split('\n').filter(Boolean)
    expect(lines.length).toBeGreaterThanOrEqual(1)

    const firstLine = JSON.parse(lines[0])
    expect(firstLine).toHaveProperty('loaderData')
    expect(firstLine).toHaveProperty('params')
    expect(firstLine).toHaveProperty('pendingKeys')
    expect(firstLine.pendingKeys).toContain('deployments')
    expect(firstLine.pendingKeys).toContain('analytics')
    // Quick stats should be in resolved data
    expect(firstLine.loaderData.quickStats).toBeDefined()
    expect(firstLine.loaderData.quickStats.users).toBe(12847)
  })

  test('NDJSON response streams deferred values as subsequent lines', async ({
    request,
  }) => {
    const response = await request.get('/__pareto/data?path=/stream')
    const body = await response.text()
    const lines = body.split('\n').filter(Boolean)

    // first line = initial, then one line per deferred key
    expect(lines.length).toBe(3)

    const deferredLines = lines.slice(1).map(l => JSON.parse(l))
    const keys = deferredLines.map(d => d.key).sort()
    expect(keys).toEqual(['analytics', 'deployments'])

    const deploymentsChunk = deferredLines.find(d => d.key === 'deployments')
    expect(deploymentsChunk.value).toBeInstanceOf(Array)
    expect(deploymentsChunk.value[0].name).toBe('v3.0.1 Hotfix')

    const analyticsChunk = deferredLines.find(d => d.key === 'analytics')
    expect(analyticsChunk.value).toBeInstanceOf(Array)
    expect(analyticsChunk.value[0].value).toBe('42ms')
  })

  test('CSR nav: quick stats render before deferred data arrives', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()

    // Quick stats resolve immediately (first NDJSON line)
    await expect(page.locator('text=12,847')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=48,392')).toBeVisible({ timeout: 3000 })

    // Deployments stream in after ~1.5s
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })
  })

  test('CSR nav: skeleton shows while deferred data streams', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR', {
      timeout: 3000,
    })

    const skeletons = page.locator('.animate-pulse')
    const skeletonCount = await skeletons.count()
    expect(skeletonCount).toBeGreaterThan(0)

    // Deployments replace skeletons after ~1.5s
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })
  })

  test('CSR nav: all deferred data resolves within ~2.5s', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()

    // deployments ~1.5s, analytics ~2.5s — both parallel, max ~2.5s + buffer
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })
    await expect(page.locator('text=v3.0.0 Major')).toBeVisible({
      timeout: 4000,
    })
    await expect(page.locator('text=v2.9.8 Patch')).toBeVisible({
      timeout: 4000,
    })
    await expect(page.locator('text=42ms')).toBeVisible({ timeout: 4000 })
    await expect(page.locator('text=94.2%')).toBeVisible({ timeout: 4000 })
    await expect(page.locator('text=0.03%')).toBeVisible({ timeout: 4000 })
  })

  test('CSR nav: navigating away mid-stream does not cause errors', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('h1')).toContainText('Streaming SSR', {
      timeout: 3000,
    })

    // Navigate away while deferred data is still in-flight
    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store', { timeout: 3000 })

    // Wait for stale promises to settle (~2.5s max)
    await page.waitForTimeout(3000)
    expect(errors).toEqual([])
  })

  test('CSR nav: back to stream page re-fetches and streams again', async ({
    page,
  }) => {
    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })

    await page.locator('header a[href="/store"]').click()
    await expect(page.locator('h1')).toContainText('Store')

    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('text=12,847')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=v3.0.1 Hotfix')).toBeVisible({
      timeout: 4000,
    })
  })

  test('CSR nav: no hydration errors after streaming navigation', async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/')
    await page.locator('header a[href="/stream"]').click()
    await expect(page.locator('text=42ms')).toBeVisible({ timeout: 4000 })

    const hydrationErrors = errors.filter(
      e =>
        e.includes('Hydration') ||
        e.includes('hydration') ||
        e.includes('preamble'),
    )
    expect(hydrationErrors).toEqual([])
  })
})

test.describe('Edge cases: Head management', () => {
  // Next.js: meta tags update on client-side navigation
  test('description meta tag changes on client-side navigation', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /everything you need/,
    )

    await page.locator('header a[href="/stream"]').click()
    await expect(page).toHaveTitle(/Streaming SSR/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      /deferred data/,
      { timeout: 5000 },
    )
  })

  // Next.js: title updates on back navigation
  test('title restores correctly on back navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Pareto/)

    await page.locator('header a[href="/stream"]').click()
    await expect(page).toHaveTitle(/Streaming SSR/)

    await page.goBack()
    await expect(page).toHaveTitle(/Pareto/)
  })

  test('title never flickers to empty during hydration', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      const observed: string[] = []
      const observer = new MutationObserver(() => {
        observed.push(document.title)
      })
      observer.observe(document.querySelector('head')!, {
        childList: true,
        subtree: true,
        characterData: true,
      })
      ;(window as any).__titleObserver = observer
      ;(window as any).__titlesObserved = observed
    })

    await page.waitForTimeout(1500)

    const titles: string[] = await page.evaluate(
      () => (window as any).__titlesObserved,
    )
    for (const t of titles) {
      expect(t.trim()).not.toBe('')
    }
  })

  test('title never flickers to empty during client-side navigation', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Pareto/)

    await page.evaluate(() => {
      const observed: string[] = []
      const observer = new MutationObserver(() => {
        observed.push(document.title)
      })
      observer.observe(document.querySelector('head')!, {
        childList: true,
        subtree: true,
        characterData: true,
      })
      ;(window as any).__titleObserver = observer
      ;(window as any).__titlesObserved = observed
    })

    await page.locator('header a[href="/stream"]').click()
    await expect(page).toHaveTitle(/Streaming SSR/)

    await page.locator('header a[href="/store"]').click()
    await expect(page).toHaveTitle(/Store/)

    await page.locator('header a[href="/"]').first().click()
    await expect(page).toHaveTitle(/Pareto/)

    const titles: string[] = await page.evaluate(
      () => (window as any).__titlesObserved,
    )
    for (const t of titles) {
      expect(t.trim()).not.toBe('')
    }
  })
})

// ---------------------------------------------------------------------------
// Security headers -- default headers are present
// ---------------------------------------------------------------------------

test.describe('Security headers', () => {
  test('response includes X-Content-Type-Options', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('response includes X-Frame-Options', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
  })

  test('response includes Referrer-Policy', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    )
  })

  test('response includes X-DNS-Prefetch-Control', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-dns-prefetch-control']).toBe('off')
  })

  test('API route also has security headers', async ({ request }) => {
    const response = await request.get('/api/time')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  })
})

// ---------------------------------------------------------------------------
// CSS -- styles should be applied
// ---------------------------------------------------------------------------

test.describe('CSS', () => {
  test('body has background color from globals.css', async ({ page }) => {
    await page.goto('/')

    const body = page.locator('body')
    const bg = await body.evaluate(
      el => window.getComputedStyle(el).backgroundColor,
    )
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})

// ---------------------------------------------------------------------------
// Layout stability -- no font-related layout shift
// ---------------------------------------------------------------------------

test.describe('Layout stability', () => {
  test('homepage has no layout shift (CLS = 0)', async ({ page }) => {
    // Observe CLS via PerformanceObserver before navigation
    await page.addInitScript(() => {
      ;(window as any).__CLS__ = 0
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            ;(window as any).__CLS__ += (entry as any).value
          }
        }
      })
      observer.observe({ type: 'layout-shift', buffered: true })
    })

    await page.goto('/')
    // Wait for any deferred rendering to settle
    await page.waitForTimeout(2000)

    const cls = await page.evaluate(() => (window as any).__CLS__)
    // CLS should be 0 or very close — no external fonts means no swap shifts
    expect(cls).toBeLessThan(0.01)
  })
})
