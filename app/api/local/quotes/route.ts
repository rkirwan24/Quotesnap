import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getQuotes, getQuote, createQuoteRecord, updateQuoteRecord, countQuotes } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const countOnly = searchParams.get('countOnly') === 'true'

    if (id) {
      const quote = await getQuote(id, session.userId)
      return NextResponse.json({ quote })
    }
    if (countOnly) {
      const count = await countQuotes(session.userId)
      return NextResponse.json({ count })
    }
    const limit = searchParams.get('limit')
    const quotes = await getQuotes(session.userId, limit ? Number(limit) : undefined)
    return NextResponse.json({ quotes })
  } catch (err: unknown) {
    console.error('[quotes GET]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const data = await request.json()
    const quote = await createQuoteRecord(session.userId, data)
    return NextResponse.json({ quote })
  } catch (err: unknown) {
    console.error('[quotes POST]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromCookies()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const data = await request.json()
    const quote = await updateQuoteRecord(id, session.userId, data)
    return NextResponse.json({ quote })
  } catch (err: unknown) {
    console.error('[quotes PATCH]', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 })
  }
}
