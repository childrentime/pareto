import { Link, useRouter } from '@paretojs/core'
import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      <NavigationProgress />
      <header className="sticky top-0 z-30 border-b border-stone-200/80 dark:border-stone-800/60 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-lg transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="text-[1.35rem] leading-none font-bold tracking-tight text-stone-900 dark:text-stone-100 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
          >
            Pareto
          </Link>
          <div className="flex items-center gap-1">
            <NavLink href="/stream">Streaming</NavLink>
            <NavLink href="/store">Store</NavLink>
            <NavLink href="/error-demo">Errors</NavLink>
            <NavLink href="/redirect-demo">Redirect</NavLink>
            <a
              href="https://github.com/childrentime/pareto"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-[0.8125rem] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 text-[0.8125rem] font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
    >
      {children}
    </Link>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  if (!mounted) return <div className="w-8 h-8" />

  return (
    <button
      onClick={() => {
        const next = !dark
        setDark(next)
        document.documentElement.classList.toggle('dark', next)
        localStorage.setItem('pareto-theme', next ? 'dark' : 'light')
      }}
      className="ml-1 w-8 h-8 flex items-center justify-center rounded-md text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}

function NavigationProgress() {
  let isNavigating = false
  try {
    const router = useRouter()
    isNavigating = router.isNavigating
  } catch {
    // SSR or before hydration
  }

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px]">
      <div
        className="h-full bg-orange-600 dark:bg-orange-500"
        style={{ animation: 'progress 2s ease-out forwards' }}
      />
    </div>
  )
}
