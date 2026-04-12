import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const MOCK_ANALYSES = [
  'Photo shows a residential backyard with existing lawn area approximately 10x12 metres. Soil appears to be loam-clay mix. There is an existing timber fence in poor condition on the right boundary. Site is reasonably level with a gentle slope toward the rear. Access appears possible through a standard side gate.',
  'Image shows a driveway/access road with significant rutting and pothole damage. Existing surface appears to be compacted gravel that has broken down. Drainage appears inadequate with evidence of water pooling. Length estimated at 80-100 metres. Vegetation encroachment on both sides.',
  'Site photo shows a sloped block with approximately 2-3 metres of level change across the building footprint. Clay-heavy soil visible in exposed areas. There is some existing vegetation to be cleared. The lower section shows signs of surface water drainage issues. Rock may be present at depth.',
  'Photo depicts a garden bed area with overgrown shrubs and weeds. Existing garden edging is damaged and needs replacement. Soil appears compact. There are several mature trees nearby that may have root interference. Total area estimated at approximately 40 square metres.',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { imageUrl } = await request.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 })
    }

    // If no OpenAI key, return a realistic mock analysis
    if (!process.env.OPENAI_API_KEY) {
      const analysis = MOCK_ANALYSES[Math.floor(Math.random() * MOCK_ANALYSES.length)]
      return NextResponse.json({ analysis })
    }

    const { openai } = await import('@/lib/openai')
    const { PHOTO_ANALYSIS_PROMPT } = await import('@/lib/prompts')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PHOTO_ANALYSIS_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
    })

    const analysis = response.choices[0]?.message?.content || ''
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Photo analysis error:', error)
    return NextResponse.json({ error: 'Photo analysis failed', analysis: '' }, { status: 500 })
  }
}
