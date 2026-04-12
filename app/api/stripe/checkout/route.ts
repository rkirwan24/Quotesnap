import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const IS_DEMO = !process.env.STRIPE_SECRET_KEY

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const { plan } = await request.json()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Demo mode — redirect to settings with info message
    if (IS_DEMO) {
      return NextResponse.json({
        url: `${appUrl}/dashboard/settings?tab=subscription&demo=true`,
        demo: true,
      })
    }

    const { stripe, PLANS } = await import('@/lib/stripe')
    const { PlanKey } = await import('@/lib/stripe') as unknown as { PlanKey: string }
    const planKey = (plan || 'starter') as typeof PlanKey
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planConfig = (PLANS as any)[planKey]

    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (profile?.email as string) || '',
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/dashboard/settings?tab=subscription&success=true`,
      cancel_url: `${appUrl}/dashboard/settings?tab=subscription`,
      metadata: { supabase_user_id: user.id, plan: planKey },
      subscription_data: { metadata: { supabase_user_id: user.id, plan: planKey } },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Could not create checkout session' }, { status: 500 })
  }
}
