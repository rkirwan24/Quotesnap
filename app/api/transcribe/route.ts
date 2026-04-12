import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MOCK_TRANSCRIPTS = [
  'I need to quote on a residential landscaping job in the backyard. The area is roughly 120 square metres. We need to remove the existing lawn, install a retaining wall about 15 metres long by 600mm high using sleepers, lay new turf across the whole area, put in a 3 metre wide concrete path along the back fence, and plant 6 advanced screening plants along the side boundary. Site access is good through the side gate.',
  'Got a grading job at a rural property. The driveway needs regrading, about 180 metres long by 4 metres wide. There are significant potholes and washouts. We\'ll need to bring in 50 tonnes of road base and compact it with the roller. There\'s also a drain at the front that needs clearing, probably 20 metres of hand work. The property is about 40 minutes from town so factor in travel.',
  'Earthworks quote for a house slab site. We need to cut and fill roughly 3 metres difference across the 15 by 12 metre building envelope. The soil is mostly clay with some shale. We\'ll need to cart away about 80 cubic metres of spoil. Install agricultural drainage around the perimeter, 50 metres total. Also 6 metres of retaining with blocks on the lower side.',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as Blob | null

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    // If no OpenAI key, return a realistic mock transcript
    if (!process.env.OPENAI_API_KEY) {
      const transcript = MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)]
      return NextResponse.json({ transcript })
    }

    const { openai } = await import('@/lib/openai')
    const { toFile } = await import('openai')
    const file = await toFile(audioFile, 'recording.webm', { type: audioFile.type || 'audio/webm' })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      prompt: 'Australian tradie describing a construction, landscaping, or earthworks job for quoting. May include measurements, materials, site conditions, and trade terminology.',
    })

    return NextResponse.json({ transcript: transcription.text })
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
