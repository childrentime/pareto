import { expect, test } from '@playwright/test'

// ---------------------------------------------------------------------------
// Custom middleware -- X-Powered-By and X-Request-Id headers
// ---------------------------------------------------------------------------

test.describe('Custom middleware', () => {
  test('X-Powered-By header is present on HTML pages', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-powered-by']).toBe('Pareto Custom Server')
  })

  test('X-Request-Id header is present on HTML pages', async ({ request }) => {
    const response = await request.get('/')
    const requestId = response.headers()['x-request-id']
    expect(requestId).toBeTruthy()
    expect(requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  test('each request gets a unique X-Request-Id', async ({ request }) => {
    const r1 = await request.get('/')
    const r2 = await request.get('/')
    expect(r1.headers()['x-request-id']).not.toBe(r2.headers()['x-request-id'])
  })

  test('custom headers present on data endpoint', async ({ request }) => {
    const response = await request.get('/__pareto/data?path=/')
    expect(response.headers()['x-powered-by']).toBe('Pareto Custom Server')
    expect(response.headers()['x-request-id']).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Custom API routes -- /custom-api/health and /custom-api/echo
// ---------------------------------------------------------------------------

test.describe('Custom API routes', () => {
  test('/custom-api/health returns status ok', async ({ request }) => {
    const response = await request.get('/custom-api/health')
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.status).toBe('ok')
    expect(json.server).toBe('custom')
    expect(json).toHaveProperty('uptime')
    expect(json).toHaveProperty('timestamp')
    expect(typeof json.uptime).toBe('number')
    expect(typeof json.timestamp).toBe('number')
  })

  test('/custom-api/echo returns request info', async ({ request }) => {
    const response = await request.get('/custom-api/echo?foo=bar&baz=1')
    expect(response.ok()).toBeTruthy()
    const json = await response.json()
    expect(json.method).toBe('GET')
    expect(json.path).toBe('/custom-api/echo')
    expect(json.query.foo).toBe('bar')
    expect(json.query.baz).toBe('1')
    expect(json.headers).toHaveProperty('user-agent')
    expect(json.headers).toHaveProperty('host')
  })

  test('custom API routes also have custom headers', async ({ request }) => {
    const response = await request.get('/custom-api/health')
    expect(response.headers()['x-powered-by']).toBe('Pareto Custom Server')
    expect(response.headers()['x-request-id']).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Security headers -- applied by custom server via securityHeaders()
// ---------------------------------------------------------------------------

test.describe('Security headers', () => {
  test('X-Content-Type-Options is nosniff', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('X-Frame-Options is SAMEORIGIN', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
  })

  test('Referrer-Policy is strict-origin-when-cross-origin', async ({
    request,
  }) => {
    const response = await request.get('/')
    expect(response.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    )
  })

  test('X-DNS-Prefetch-Control is off', async ({ request }) => {
    const response = await request.get('/')
    expect(response.headers()['x-dns-prefetch-control']).toBe('off')
  })

  test('security headers on custom API routes', async ({ request }) => {
    const response = await request.get('/custom-api/health')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('SAMEORIGIN')
  })
})

// ---------------------------------------------------------------------------
// SSR -- pages render correctly
// ---------------------------------------------------------------------------

test.describe('SSR rendering', () => {
  test('index page renders with custom server info', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('Custom Server Example')
    await expect(page.locator('code', { hasText: 'app.ts' })).toBeVisible()
    await expect(page.locator('text=Pareto Custom Server')).toBeVisible()
  })

  test('about page renders', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('h1')).toContainText('About')
    await expect(page.locator('text=custom Express server')).toBeVisible()
  })

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent')
    expect(response?.status()).toBe(404)
    await expect(page.locator('text=404')).toBeVisible()
    await expect(
      page.locator('text=This page could not be found'),
    ).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Hydration -- pages hydrate without errors
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

  test('about page hydrates without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/about')
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
})

// ---------------------------------------------------------------------------
// Head management
// ---------------------------------------------------------------------------

test.describe('Head management', () => {
  test('index page has correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Custom Server Example/)
  })

  test('about page has correct title', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/About/)
  })

  test('title updates on client-side navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Custom Server Example/)

    await page.locator('header a[href="/about"]').click()
    await expect(page).toHaveTitle(/About/)
  })
})

// ---------------------------------------------------------------------------
// Client-side navigation
// ---------------------------------------------------------------------------

test.describe('Client-side navigation', () => {
  test('index -> about via nav link', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/about"]').click()
    await expect(page.locator('h1')).toContainText('About')
    expect(page.url()).toContain('/about')
  })

  test('about -> home via back link', async ({ page }) => {
    await page.goto('/about')
    await page.locator('a', { hasText: 'Back to Home' }).click()
    await expect(page.locator('h1')).toContainText('Custom Server Example')
  })

  test('browser back button works', async ({ page }) => {
    await page.goto('/')
    await page.locator('header a[href="/about"]').click()
    await expect(page.locator('h1')).toContainText('About')

    await page.goBack()
    await expect(page.locator('h1')).toContainText('Custom Server Example')
  })

  test('404 Go Home link works', async ({ page }) => {
    await page.goto('/nonexistent')
    await expect(page.locator('text=404')).toBeVisible()
    await page.locator('a', { hasText: 'Go Home' }).click()
    await expect(page.locator('h1')).toContainText('Custom Server Example')
  })
})
