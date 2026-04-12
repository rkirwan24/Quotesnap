import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  }
  return _stripe
}

// Keep a named export for convenience in routes that always have env vars
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    get priceId() { return process.env.STRIPE_STARTER_PRICE_ID || '' },
    quotesPerMonth: 20,
    photosPerQuote: 3,
    customBranding: false,
    templates: 3,
    prioritySupport: false,
  },
  pro: {
    name: 'Pro',
    price: 99,
    get priceId() { return process.env.STRIPE_PRO_PRICE_ID || '' },
    quotesPerMonth: Infinity,
    photosPerQuote: 6,
    customBranding: true,
    templates: Infinity,
    prioritySupport: true,
  },
} as const

export type PlanKey = keyof typeof PLANS
