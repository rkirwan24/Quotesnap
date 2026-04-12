import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { openai } from '@/lib/openai'
import { buildQuoteGenerationPrompt } from '@/lib/prompts'
import type { GenerateQuoteRequest } from '@/types'

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
        new Date(profile.trial_ends_at) < new Date()

      const isOverStarterLimit =
        profile.subscription_tier === 'starter' &&
        profile.subscription_status === 'active' &&
        profile.quotes_this_month >= 20

      if (isTrialExpired || isOverStarterLimit) {
        return NextResponse.json(
          { error: 'Quote limit reached. Please upgrade your subscription.' },
          { status: 403 }
        )
      }
    }

    const body: GenerateQuoteRequest = await request.json()
    const { transcript, photoAnalysis, jobType, businessProfile, templateDefaults } = body

    if (!transcript || transcript.trim().length < 10) {
      return NextResponse.json({ error: 'Job description too short' }, { status: 400 })
    }

    const prompt = buildQuoteGenerationPrompt({
      transcript,
      photoAnalysis: photoAnalysis || '',
      jobType,
      businessProfile,
      templateDefaults,
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

    let generated
    try {
      generated = JSON.parse(rawContent)
    } catch {
      throw new Error('AI returned invalid JSON')
    }

    // Validate structure
    if (!generated.line_items || !Array.isArray(generated.line_items)) {
      throw new Error('AI response missing line_items')
    }

    // Ensure totals are correct
    generated.line_items = generated.line_items.map((item: {
      quantity: number
      unit_price: number
      total: number
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
