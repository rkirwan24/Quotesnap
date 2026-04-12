import { NextRequest, NextResponse } from 'next/server'
import { readFile } from '@/lib/local/storage'

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  webm: 'audio/webm',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const [bucket, ...rest] = params.path
  const filename = rest.join('/')

  if (!bucket || !filename) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const data = readFile(bucket, filename)
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const contentType = CONTENT_TYPES[ext] || 'application/octet-stream'

  return new NextResponse(data as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
