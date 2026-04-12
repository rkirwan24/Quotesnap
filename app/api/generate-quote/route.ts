import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { GenerateQuoteRequest } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// Realistic mock quotes for different job types
function buildMockQuote(jobType: string, transcript: string) {
  const isLandscaping = jobType === 'landscaping' || jobType === 'lawn_care'
  const isEarthworks = jobType === 'earthworks' || jobType === 'excavation' || jobType === 'driveways'
  const isBuilding = jobType === 'building' || jobType === 'carpentry' || jobType === 'concreting'
  const isPlumbing = jobType === 'plumbing'
  const isElectrical = jobType === 'electrical'

  if (isEarthworks) {
    return {
      site_notes: 'Site inspection completed. Property requires significant earthworks to prepare building platform and improve site drainage. Clay-heavy soil will require moisture conditioning before compaction.',
      line_items: [
        { id: uuidv4(), category: 'labour', description: 'Excavator hire — 8t excavator operator (2 days)', quantity: 2, unit: 'day', unit_price: 1650, total: 3300 },
        { id: uuidv4(), category: 'labour', description: 'Skid steer loader with operator (1 day)', quantity: 1, unit: 'day', unit_price: 1200, total: 1200 },
        { id: uuidv4(), category: 'labour', description: 'Labourer — general earthworks assist', quantity: 16, unit: 'hr', unit_price: 65, total: 1040 },
        { id: uuidv4(), category: 'plant', description: 'Plate compactor hire', quantity: 2, unit: 'day', unit_price: 150, total: 300 },
        { id: uuidv4(), category: 'materials', description: 'Road base — 20mm crushed rock (40 tonne)', quantity: 40, unit: 't', unit_price: 55, total: 2200 },
        { id: uuidv4(), category: 'materials', description: 'Agricultural drainage pipe 100mm (50m)', quantity: 50, unit: 'm', unit_price: 18, total: 900 },
        { id: uuidv4(), category: 'subcontract', description: 'Spoil disposal — 60 cubic metres (truck and tip)', quantity: 6, unit: 'load', unit_price: 380, total: 2280 },
      ],
      scope_of_work: `1. Site preparation and set-out\n2. Cut and fill earthworks to achieve required platform levels\n3. Install agricultural drainage around perimeter\n4. Compact subgrade to engineering specification\n5. Supply and spread road base to required depth\n6. Final grading and compaction\n7. Site clean-up and spoil removal`,
      exclusions: `• Rock breaking or blasting\n• Retaining walls (can be quoted separately)\n• Engineering certification fees\n• Council permits\n• Topsoil supply or lawn reinstatement`,
      assumptions: `• Site access suitable for heavy machinery\n• No underground services in work area (owner to confirm with Dial Before You Dig)\n• Spoil to be carted offsite — no fill material to be retained on property\n• Work to be completed in dry conditions`,
      timeline: '3–4 days',
    }
  }

  if (isLandscaping) {
    return {
      site_notes: 'Standard residential landscaping project. Backyard area requires full renovation including turf removal, retaining, new lawn and garden beds. Good site access via side gate.',
      line_items: [
        { id: uuidv4(), category: 'labour', description: 'Landscape gardener — full renovation (3 days)', quantity: 3, unit: 'day', unit_price: 850, total: 2550 },
        { id: uuidv4(), category: 'labour', description: 'Labourer — site preparation and clean-up', quantity: 12, unit: 'hr', unit_price: 60, total: 720 },
        { id: uuidv4(), category: 'materials', description: 'Buffalo turf — Sir Walter DNA certified (120 sqm)', quantity: 120, unit: 'm²', unit_price: 19, total: 2280 },
        { id: uuidv4(), category: 'materials', description: 'Premium turf underlay/soil conditioner (3 cubic metres)', quantity: 3, unit: 'm³', unit_price: 145, total: 435 },
        { id: uuidv4(), category: 'materials', description: 'Hardwood sleepers 200x75mm (15 lin metres)', quantity: 15, unit: 'm', unit_price: 42, total: 630 },
        { id: uuidv4(), category: 'materials', description: 'Galvanised retaining wall hardware', quantity: 1, unit: 'lot', unit_price: 320, total: 320 },
        { id: uuidv4(), category: 'materials', description: 'Advanced screening plants (6 x 45L Lilly Pilly)', quantity: 6, unit: 'ea', unit_price: 95, total: 570 },
        { id: uuidv4(), category: 'subcontract', description: 'Green waste and rubbish removal', quantity: 2, unit: 'load', unit_price: 280, total: 560 },
      ],
      scope_of_work: `1. Strip and remove existing lawn and garden material\n2. Grade and prepare subgrade\n3. Construct retaining wall — 15 metres hardwood sleepers\n4. Backfill and compact retained area\n5. Supply and install 120m² Sir Walter turf with soil preparation\n6. Plant 6 advanced Lilly Pilly screening plants\n7. Mulch garden beds (50mm depth)\n8. Site clean-up and green waste removal`,
      exclusions: `• Irrigation system (can be quoted separately)\n• Concrete or paving works\n• Tree removal\n• Fencing\n• Lighting`,
      assumptions: `• Existing turf and garden waste to be removed from site by contractor\n• Sleeper retaining wall maximum 600mm exposed height — no engineering required\n• Water available on site for establishment watering\n• Property owner to water turf as per supplier schedule after installation`,
      timeline: '3–4 days',
    }
  }

  if (isBuilding || isPlumbing || isElectrical) {
    return {
      site_notes: 'Residential renovation/maintenance works. Site conditions noted on inspection. Standard suburban property with good access.',
      line_items: [
        { id: uuidv4(), category: 'labour', description: 'Qualified tradesperson labour', quantity: 16, unit: 'hr', unit_price: 110, total: 1760 },
        { id: uuidv4(), category: 'labour', description: 'Apprentice/labourer assist', quantity: 8, unit: 'hr', unit_price: 65, total: 520 },
        { id: uuidv4(), category: 'materials', description: 'Supply materials — as per specification', quantity: 1, unit: 'lot', unit_price: 1450, total: 1450 },
        { id: uuidv4(), category: 'materials', description: 'Consumables and fixings', quantity: 1, unit: 'lot', unit_price: 220, total: 220 },
        { id: uuidv4(), category: 'subcontract', description: 'Waste removal and disposal', quantity: 1, unit: 'lot', unit_price: 280, total: 280 },
      ],
      scope_of_work: `Works as discussed during site inspection:\n\n1. Site preparation and protection\n2. Complete works as described\n3. Testing and commissioning\n4. Site clean-up and handover`,
      exclusions: `• Any works not specifically listed above\n• Damage repair to surrounding finishes unless caused by contractor\n• Council or building approval fees\n• Structural engineering (if required, additional cost)`,
      assumptions: `• Suitable site access during normal business hours\n• Existing services located and confirmed by owner/Dial Before You Dig\n• Any variations to agreed scope will be quoted separately before proceeding`,
      timeline: '2–3 days',
    }
  }

  // Generic fallback
  const words = transcript.toLowerCase()
  const hours = words.includes('day') ? 16 : 8
  return {
    site_notes: 'Site inspection completed. Works as described in job brief. See scope of works below for full detail.',
    line_items: [
      { id: uuidv4(), category: 'labour', description: 'Skilled tradesperson labour', quantity: hours, unit: 'hr', unit_price: 95, total: hours * 95 },
      { id: uuidv4(), category: 'labour', description: 'Labourer/assistant', quantity: hours / 2, unit: 'hr', unit_price: 60, total: (hours / 2) * 60 },
      { id: uuidv4(), category: 'materials', description: 'Supply and install materials — as specified', quantity: 1, unit: 'lot', unit_price: 1200, total: 1200 },
      { id: uuidv4(), category: 'materials', description: 'Consumables, fixings and sundries', quantity: 1, unit: 'lot', unit_price: 180, total: 180 },
    ],
    scope_of_work: 'Works as described and agreed during site inspection. All items listed in the schedule of works will be completed to a professional standard in accordance with relevant Australian Standards.',
    exclusions: '• Any works not specifically listed in this quote\n• Permit and approval fees\n• Any structural works unless specifically included',
    assumptions: '• Suitable site access and working conditions\n• No latent/hidden site conditions that would materially affect the works\n• Works to proceed during normal business hours',
    timeline: '1–2 days',
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    // Check subscription limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_tier, quotes_this_month, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isTrialExpired =
        profile.subscription_status === 'trial' &&
        profile.trial_ends_at &&
        new Date(profile.trial_ends_at as string) < new Date()

      const isOverStarterLimit =
        profile.subscription_tier === 'starter' &&
        profile.subscription_status === 'active' &&
        (profile.quotes_this_month as number) >= 20

      if (isTrialExpired || isOverStarterLimit) {
        return NextResponse.json(
          { error: 'Quote limit reached. Please upgrade your subscription.' },
          { status: 403 }
        )
      }
    }

    const body: GenerateQuoteRequest = await request.json()
    const { transcript, jobType } = body

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Job description too short' }, { status: 400 })
    }

    // Use real OpenAI if key is available, otherwise return mock
    if (!process.env.OPENAI_API_KEY) {
      const mock = buildMockQuote(jobType || 'landscaping', transcript)
      const lineItems = mock.line_items.map((item) => ({
        ...item,
        total: Math.round(item.quantity * item.unit_price * 100) / 100,
      }))
      return NextResponse.json({ ...mock, line_items: lineItems })
    }

    const { openai } = await import('@/lib/openai')
    const { buildQuoteGenerationPrompt } = await import('@/lib/prompts')

    const prompt = buildQuoteGenerationPrompt({
      transcript: body.transcript,
      photoAnalysis: body.photoAnalysis || '',
      jobType: body.jobType,
      businessProfile: body.businessProfile,
      templateDefaults: body.templateDefaults,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const rawContent = completion.choices[0]?.message?.content
    if (!rawContent) throw new Error('Empty response from AI')

    const generated = JSON.parse(rawContent)

    if (!generated.line_items || !Array.isArray(generated.line_items)) {
      throw new Error('AI response missing line_items')
    }

    generated.line_items = generated.line_items.map((item: {
      quantity: number; unit_price: number; total: number
    }) => ({
      ...item,
      total: Math.round(item.quantity * item.unit_price * 100) / 100,
    }))

    return NextResponse.json(generated)
  } catch (error) {
    console.error('Quote generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quote generation failed' },
      { status: 500 }
    )
  }
}
