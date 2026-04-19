import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getTemplates, createTemplate } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const templates = await getTemplates(session.userId)
    return NextResponse.json({ templates })
  } catch (err: unknown) {
    console.error('[templates GET]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const data = await request.json()
    const template = await createTemplate(session.userId, data)
    return NextResponse.json({ template })
  } catch (err: unknown) {
    console.error('[templates POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
