import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { getClients, createClientRecord, updateClientRecord, deleteClientRecord } from '@/lib/db'

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clients = await getClients(session.userId)
  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await request.json()
  const client = await createClientRecord(session.userId, data)
  return NextResponse.json({ client })
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const data = await request.json()
  const client = await updateClientRecord(id, session.userId, data)
  return NextResponse.json({ client })
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await deleteClientRecord(id, session.userId)
  return NextResponse.json({ success: true })
}
