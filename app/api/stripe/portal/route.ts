import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const IS_DEMO = !process.env.STRIPE_SECRET_KEY

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Demo mode — redirect to settings subscription tab
    if (IS_DEMO) {
      return NextResponse.json({
        url: `${appUrl}/dashboard/settings?tab=subscription&demo=true`,
        demo: true,
      })
    }

    const { stripe } = await import('@/lib/stripe')

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id as string,
      return_url: `${appUrl}/dashboard/settings?tab=subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Could not open subscription portal' }, { status: 500 })
  }
}
