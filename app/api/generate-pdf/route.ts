import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { QuotePDF } from '@/lib/pdf'
import type { Quote, Profile, Client } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    let quote: Quote
    let profile: Profile
    let client: Client | null = null

    if (body.quoteId) {
      // Load from DB
      const [quoteRes, profileRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('*, client:clients(*)')
          .eq('id', body.quoteId)
          .eq('user_id', user.id)
          .single(),
        supabase.from('profiles').select('*').eq('id', user.id).single(),
      ])

      if (!quoteRes.data) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }

      quote = quoteRes.data
      profile = profileRes.data
      client = quote.client as Client | null
    } else if (body.formData && body.profile) {
      // From wizard (not yet saved)
      const fd = body.formData
      profile = body.profile

      quote = {
        id: 'preview',
        user_id: user.id,
        client_id: fd.clientId,
        quote_number: 'DRAFT',
        status: 'draft',
        job_type: fd.jobType,
        job_description: fd.voiceTranscript,
        site_notes: fd.siteNotes,
        line_items: fd.lineItems,
        subtotal: fd.lineItems.reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0),
        margin_percent: fd.marginPercent,
        margin_amount: 0,
        gst_amount: 0,
        total: 0,
        gst_included: fd.gstIncluded,
        scope_of_work: fd.scopeOfWork,
        exclusions: fd.exclusions,
        assumptions: fd.assumptions,
        timeline: fd.timeline,
        payment_terms: fd.paymentTerms,
        validity_days: fd.validityDays,
        voice_note_url: null,
        voice_transcript: fd.voiceTranscript,
        photo_urls: fd.photoUrls,
        photo_analysis: fd.photoAnalysis,
        pdf_url: null,
        sent_at: null,
        accepted_at: null,
        declined_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Calculate totals
      const subtotal = fd.lineItems.reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0)
      const marginAmount = subtotal * (fd.marginPercent / 100)
      const subtotalWithMargin = subtotal + marginAmount
      const gstAmount = fd.gstIncluded ? subtotalWithMargin * 0.1 : 0
      quote.subtotal = Math.round(subtotal * 100) / 100
      quote.margin_amount = Math.round(marginAmount * 100) / 100
      quote.gst_amount = Math.round(gstAmount * 100) / 100
      quote.total = Math.round((subtotalWithMargin + gstAmount) * 100) / 100

      // Client from formData
      if (fd.clientData) {
        client = { ...fd.clientData, id: 'preview', user_id: user.id, created_at: new Date().toISOString() }
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, { quote, profile, client }) as any
    )

    return new NextResponse(Buffer.from(pdfBuffer) as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quote.quote_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}
