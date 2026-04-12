import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getQuotes, getQuote, createQuoteRecord, updateQuoteRecord, countQuotes } from '@/lib/local/db'

export async function GET(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const countOnly = searchParams.get('countOnly') === 'true'

  if (id) {
    const quote = getQuote(id, session.userId)
    return NextResponse.json({ quote })
  }
  if (countOnly) {
    const count = countQuotes(session.userId)
    return NextResponse.json({ count })
  }
  const limit = searchParams.get('limit')
  const quotes = getQuotes(session.userId, limit ? Number(limit) : undefined)
  return NextResponse.json({ quotes })
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await request.json()
  const quote = createQuoteRecord(session.userId, data)
  return NextResponse.json({ quote })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const data = await request.json()
  const quote = updateQuoteRecord(id, session.userId, data)
  return NextResponse.json({ quote })
}
