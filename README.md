# QuoteSnap

AI-powered quote generator for Australian builders, landscapers, and earthworks operators. Record a voice note after a site visit, attach photos, and get a professional branded PDF quote in under 60 seconds.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase (Postgres + Auth + Storage)
- **AI:** OpenAI API (Whisper for voice transcription, GPT-4o for quote generation and photo analysis)
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **PDF Generation:** @react-pdf/renderer
- **Email:** Resend
- **Deployment:** Vercel

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd quotesnap
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — from your Supabase project dashboard
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project API settings
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project API settings (keep secret)
- `OPENAI_API_KEY` — from platform.openai.com
- `STRIPE_SECRET_KEY` — from Stripe dashboard (use test mode key for development)
- `STRIPE_WEBHOOK_SECRET` — from Stripe webhook configuration
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard
- `STRIPE_STARTER_PRICE_ID` — Stripe price ID for the $49/month starter plan
- `STRIPE_PRO_PRICE_ID` — Stripe price ID for the $99/month pro plan
- `RESEND_API_KEY` — from resend.com
- `EMAIL_FROM` — verified sender email (e.g. quotes@yourdomain.com.au)
- `NEXT_PUBLIC_APP_URL` — your app URL (http://localhost:3000 for development)

### 3. Set up Supabase

1. Create a new Supabase project at supabase.com
2. Run the migration SQL from `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Create the storage buckets in the Supabase dashboard (Storage > New bucket):
   - `voice-notes` — private
   - `site-photos` — private
   - `quote-pdfs` — private
   - `logos` — public

4. Configure storage bucket policies to allow authenticated users to upload to their own folders.

### 4. Set up Stripe

1. Create a Stripe account and enable test mode
2. Create two recurring products:
   - **Starter** — $49 AUD/month
   - **Pro** — $99 AUD/month
3. Copy the price IDs to your `.env.local`
4. Set up a webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
5. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.paid`
6. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local webhook testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 5. Set up Resend

1. Create an account at resend.com
2. Verify your sending domain
3. Create an API key and add to `RESEND_API_KEY`
4. Set `EMAIL_FROM` to a verified email address on your domain

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment to Vercel

1. Push to GitHub
2. Import the repository in Vercel
3. Add all environment variables in Vercel project settings
4. Deploy

The `vercel.json` configuration sets appropriate function timeouts for AI and PDF generation.

### Custom domain

1. Add your domain in Vercel project settings
2. Update DNS records as instructed by Vercel
3. Update `NEXT_PUBLIC_APP_URL` to your production domain
4. Update the Stripe webhook URL to your production domain

## Architecture

```
app/
├── page.tsx                    Landing page (public)
├── login/                      Auth
├── signup/                     Auth
├── dashboard/
│   ├── page.tsx                Dashboard home (stats + recent quotes)
│   ├── new-quote/              5-step quote wizard
│   ├── quotes/                 Quote list + single quote view
│   ├── clients/                Client directory
│   └── settings/               Business profile, branding, subscription
└── api/
    ├── transcribe/             Whisper transcription
    ├── generate-quote/         GPT-4o quote generation
    ├── analyze-photo/          GPT-4o Vision site photo analysis
    ├── generate-pdf/           @react-pdf/renderer PDF generation
    ├── send-quote/             Resend email with PDF attachment
    ├── stripe/checkout/        Stripe Checkout session creation
    ├── stripe/portal/          Stripe Customer Portal redirect
    └── stripe/webhook/         Stripe webhook handler
```

## New Quote Flow

1. **Client** — Select existing client or add new one inline
2. **Voice + Photos** — Record voice note (transcribed by Whisper), upload site photos (analysed by GPT-4o Vision), select job type
3. **Generating** — AI (GPT-4o) generates complete quote with line items, pricing, scope, exclusions
4. **Review** — Inline editing of all line items, margin slider, section editing
5. **Preview + Send** — PDF preview, download, email to client via Resend

## Subscription Tiers

| | Starter ($49/mo) | Pro ($99/mo) |
|---|---|---|
| Quotes/month | 20 | Unlimited |
| Photos/quote | 3 | 6 |
| Custom branding | No | Yes |
| Templates | 3 | Unlimited |

14-day free trial, no credit card required.
