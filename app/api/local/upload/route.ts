import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookies } from '@/lib/local/auth'
import { saveFile } from '@/lib/local/storage'

export async function POST(request: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const bucket = formData.get('bucket') as string
  const filePath = formData.get('path') as string
  const file = formData.get('file') as File | null

  if (!bucket || !filePath || !file) {
    return NextResponse.json({ error: 'Missing required fields: bucket, path, file' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const publicUrl = await saveFile(bucket, filePath, arrayBuffer)

  return NextResponse.json({ path: filePath, publicUrl })
}
