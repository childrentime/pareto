import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { RouterProvider } from '../router/context'
import { Link } from '../router/link'

function renderWithRouter(element: React.ReactNode) {
  return renderToString(
    createElement(
      RouterProvider,
      {
        initialPathname: '/',
        initialParams: {},
        initialLoaderData: null,
        manifest: null,
      },
      element,
    ),
  )
}

describe('Link', () => {
  it('renders an anchor element with correct href', () => {
    const html = renderWithRouter(
      createElement(Link, { href: '/about' }, 'About'),
    )
    expect(html).toContain('href="/about"')
    expect(html).toContain('About')
  })

  it('passes through additional HTML attributes', () => {
    const html = renderWithRouter(
      createElement(
        Link,
        { href: '/test', className: 'nav-link', id: 'link-1' },
        'Test',
      ),
    )
    expect(html).toContain('class="nav-link"')
    expect(html).toContain('id="link-1"')
  })

  it('renders children content', () => {
    const html = renderWithRouter(
      createElement(
        Link,
        { href: '/home' },
        createElement('span', null, 'Home'),
      ),
    )
    expect(html).toContain('<span>Home</span>')
  })

  it('renders with target attribute', () => {
    const html = renderWithRouter(
      createElement(Link, { href: '/external', target: '_blank' }, 'External'),
    )
    expect(html).toContain('target="_blank"')
  })

  it('renders with aria-label', () => {
    const html = renderWithRouter(
      createElement(Link, { href: '/', 'aria-label': 'Go home' }, 'Home'),
    )
    expect(html).toContain('aria-label="Go home"')
  })
})
