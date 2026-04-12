import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { QuotePDF } from '@/lib/pdf'
import type { Quote, Profile, Client } from '@/types'

function getResend() {
  if (!process.env.RESEND_API_KEY) return null
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = await request.json()
    const { quoteId, formData: fd, profile: profileData, recipientEmail } = body

    if (!recipientEmail) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 })
    }

    let quote: Quote
    let profile: Profile
    let client: Client | null = null

    if (quoteId) {
      const [quoteRes, profileRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('*, client:clients(*)')
          .eq('id', quoteId)
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
    } else if (fd && profileData) {
      profile = profileData
      quote = {
        id: 'preview',
        user_id: user.id,
        client_id: fd.clientId,
        quote_number: `QS-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        status: 'draft',
        job_type: fd.jobType,
        job_description: fd.voiceTranscript,
        site_notes: fd.siteNotes,
        line_items: fd.lineItems,
        subtotal: 0,
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

      const subtotal = fd.lineItems.reduce((s: number, i: { quantity: number; unit_price: number }) => s + i.quantity * i.unit_price, 0)
      const marginAmount = subtotal * (fd.marginPercent / 100)
      const subtotalWithMargin = subtotal + marginAmount
      const gstAmount = fd.gstIncluded ? subtotalWithMargin * 0.1 : 0
      quote.subtotal = Math.round(subtotal * 100) / 100
      quote.margin_amount = Math.round(marginAmount * 100) / 100
      quote.gst_amount = Math.round(gstAmount * 100) / 100
      quote.total = Math.round((subtotalWithMargin + gstAmount) * 100) / 100

      if (fd.clientData) {
        client = { ...fd.clientData, id: 'preview', user_id: user.id, created_at: new Date().toISOString() }
      }
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    // Generate PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotePDF, { quote, profile, client }) as any
    )

    const clientName = client?.name || 'there'
    const contactName = profile?.contact_name || profile?.business_name || 'your trades person'
    const businessName = profile?.business_name || 'QuoteSnap'
    const fromEmail = process.env.EMAIL_FROM || 'quotes@quotesnap.com.au'

    const resend = getResend()
    if (!resend) {
      // Demo mode — log the email to console instead of sending
      console.log(`[Demo] Email would be sent to: ${recipientEmail}`)
      console.log(`[Demo] Subject: Quote ${quote.quote_number}`)
      return NextResponse.json({ success: true, demo: true })
    }

    await resend.emails.send({
      from: `${businessName} <${fromEmail}>`,
      to: recipientEmail,
      subject: `Quote ${quote.quote_number} from ${businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <p>Hi ${clientName},</p>

          <p>Thank you for the opportunity to quote on your project.</p>

          <p>Please find attached our quote <strong>${quote.quote_number}</strong> for the described works.
          This quote is valid for <strong>${quote.validity_days} days</strong>.</p>

          ${quote.total > 0 ? `<p>Total: <strong>$${quote.total.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${quote.gst_included ? '(inc. GST)' : '(ex. GST)'}</strong></p>` : ''}

          <p>If you have any questions or would like to discuss the scope, please don&apos;t hesitate to get in touch.</p>

          <p>
            Kind regards,<br />
            <strong>${contactName}</strong><br />
            ${businessName}<br />
            ${profile?.phone ? `${profile.phone}<br />` : ''}
            ${profile?.email ? `${profile.email}` : ''}
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `${quote.quote_number}.pdf`,
          content: Buffer.from(pdfBuffer),
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send quote error:', error)
    return NextResponse.json(
      { error: 'Failed to send quote' },
      { status: 500 }
    )
  }
}
