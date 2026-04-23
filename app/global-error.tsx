'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ background: '#060709', margin: 0, fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: 480, width: '100%', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, background: 'rgba(239,68,68,0.1)', padding: 32 }}>
            <h2 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Server error</h2>
            <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 16 }}>{error.message || 'Unknown error'}</p>
            {error.digest && (
              <p style={{ color: '#71717a', fontSize: 11, marginBottom: 16 }}>Digest: {error.digest}</p>
            )}
            <button
              onClick={reset}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 16px', color: 'white', cursor: 'pointer', fontSize: 14 }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
