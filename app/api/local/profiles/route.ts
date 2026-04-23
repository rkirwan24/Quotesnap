import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getProfile, updateProfile } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const profile = await getProfile(session.userId)
    return NextResponse.json({ profile })
  } catch (err: unknown) {
    console.error('[profiles GET]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const data = await request.json()
    await updateProfile(session.userId, data)
    const profile = await getProfile(session.userId)
    return NextResponse.json({ profile })
  } catch (err: unknown) {
    console.error('[profiles PATCH]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
