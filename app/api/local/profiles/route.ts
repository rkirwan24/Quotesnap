import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getProfile, updateProfile } from '@/lib/local/db'

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const profile = getProfile(session.userId)
  return NextResponse.json({ profile })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await request.json()
  updateProfile(session.userId, data)
  const profile = getProfile(session.userId)
  return NextResponse.json({ profile })
}
