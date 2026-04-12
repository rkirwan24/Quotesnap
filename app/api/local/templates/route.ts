import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getTemplates, createTemplate } from '@/lib/local/db'

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const templates = getTemplates(session.userId)
  return NextResponse.json({ templates })
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await request.json()
  const template = createTemplate(session.userId, data)
  return NextResponse.json({ template })
}
