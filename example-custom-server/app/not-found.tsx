import { Link } from '@paretojs/core'

export default function NotFound() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-center">
      <h1 className="text-6xl font-bold text-stone-300 mb-4">404</h1>
      <p className="text-stone-500 mb-6">This page could not be found.</p>
      <Link
        href="/"
        className="text-sm font-medium text-orange-700 hover:underline"
      >
        Go Home
      </Link>
    </div>
  )
}
