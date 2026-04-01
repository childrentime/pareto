import { Link } from '@paretojs/core'
import type { PropsWithChildren } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <header className="border-b border-stone-200 bg-stone-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-stone-900 hover:text-orange-700 transition-colors"
          >
            Custom Server
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/hooks"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Hooks
            </Link>
            <a
              href="/custom-api/health"
              target="_blank"
              className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              Health API
            </a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
