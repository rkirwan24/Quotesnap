import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const hasPg = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL)

  if (!hasPg) {
    return NextResponse.json({
      ok: false,
      db: 'none',
      message:
        'POSTGRES_URL is not set. Running in SQLite mode — data does not persist between serverless cold-starts on Vercel, so sign-in will fail after a cold start.',
      fix: 'Go to your Vercel project → Storage tab → Connect Store → Create New → Postgres',
    }, { status: 503 })
  }

  try {
    const { ping } = await import('@/lib/local/pg-db')
    await ping()
    return NextResponse.json({ ok: true, db: 'postgres' })
  } catch (err) {
    return NextResponse.json({
      ok: false,
      db: 'postgres_error',
      message: err instanceof Error ? err.message : String(err),
    }, { status: 503 })
  }
}
