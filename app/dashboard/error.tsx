'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#060709] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8">
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-red-400 text-sm font-mono break-all mb-4">{error.message}</p>
          {error.digest && (
            <p className="text-zinc-500 text-xs mb-4">Digest: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
