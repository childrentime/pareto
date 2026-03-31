/**
 * Default error UI used when no custom error component is provided.
 * Shared between server and client rendering paths.
 */
export function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '32rem',
        margin: '4rem auto',
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          color: '#dc2626',
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          color: '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        {error.message}
      </p>
      <a
        href="/"
        style={{ color: '#2563eb', fontSize: '0.875rem', fontWeight: 500 }}
      >
        Go Home
      </a>
    </div>
  )
}
