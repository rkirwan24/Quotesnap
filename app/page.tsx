import Link from 'next/link'
import { Mic, FileText, Send, Check, ChevronRight, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="landing-dark min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#060709]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white text-lg">QuoteSnap</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">How it works</a>
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-app-green px-4 py-2 text-sm font-medium text-white hover:bg-app-green/90 transition-colors"
            >
              Start free trial
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm text-gold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            AI-powered quoting for Australian tradies
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6">
            Stop writing quotes
            <br />
            <span className="text-gold italic">at midnight.</span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Record a voice note after your site visit. Get a professional branded quote in 60 seconds.
            Send it before your competitor gets home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-app-green px-8 py-4 text-lg font-semibold text-white hover:bg-app-green/90 transition-all hover:scale-105 shadow-lg shadow-app-green/20"
            >
              Start Free Trial
              <ChevronRight className="h-5 w-5" />
            </Link>
            <span className="text-zinc-500 text-sm">14 days free. No credit card required.</span>
          </div>

          <p className="text-zinc-500 text-sm">
            Join 500+ Australian tradies saving 5+ hours a week
          </p>

          {/* App preview card */}
          <div className="mt-16 relative mx-auto max-w-3xl">
            <div className="rounded-2xl border border-white/10 bg-[#111318] p-6 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-white/5 text-center text-xs text-zinc-500 leading-6">
                  quotesnap.com.au/dashboard/new-quote
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                  <div className="rounded-lg bg-white/5 p-4">
                    <div className="text-xs text-zinc-500 mb-2">AI-generated quote</div>
                    <div className="space-y-2">
                      {[
                        { label: 'Excavation 45m³ @ $38/m³', val: '$1,710' },
                        { label: 'Mini excavator hire 2 days', val: '$960' },
                        { label: 'Disposal 22 loads @ $130/hr', val: '$2,860' },
                        { label: 'Import fill 30 tonne', val: '$1,200' },
                        { label: 'Compaction and levelling', val: '$680' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between text-xs">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className="text-white font-medium">{item.val}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                      <span className="text-sm font-semibold text-white">Total (inc. GST)</span>
                      <span className="text-lg font-bold text-gold">$8,151</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-lg bg-white/5 p-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-2">
                      <Mic className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-xs text-zinc-400">Recording...</div>
                    <div className="text-xs text-red-400 font-mono">0:47</div>
                  </div>
                  <div className="rounded-lg bg-app-green/20 border border-app-green/30 p-3 text-center">
                    <div className="text-xs text-app-green font-medium">Ready to send</div>
                    <div className="text-xs text-zinc-400 mt-1">Generated in 42s</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-gold font-medium tracking-widest uppercase mb-3">How it works</div>
            <h2 className="font-display text-4xl font-bold text-white">
              Voice in. Quote out.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <Mic className="w-6 h-6" />,
                title: 'Record',
                description:
                  'Describe the job in a 60 second voice note. Snap a few site photos. That\'s your raw material.',
              },
              {
                step: '02',
                icon: <FileText className="w-6 h-6" />,
                title: 'Generate',
                description:
                  'AI builds your quote with accurate line items, realistic Australian pricing, your margin, and GST.',
              },
              {
                step: '03',
                icon: <Send className="w-6 h-6" />,
                title: 'Send',
                description:
                  'Review, tweak if needed, and send a professional branded PDF quote straight to your client\'s inbox.',
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="rounded-2xl border border-white/10 bg-[#111318] p-6 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                      {item.icon}
                    </div>
                    <div className="text-3xl font-bold text-white/10 font-display leading-none pt-1">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-4 sm:px-6 bg-[#0a0c0f]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm text-gold font-medium tracking-widest uppercase mb-3">Sound familiar?</div>
              <h2 className="font-display text-4xl font-bold text-white mb-6">
                The average tradie spends{' '}
                <span className="text-gold italic">15+ hours a week</span> on admin.
                Quoting is the worst of it.
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                QuoteSnap was built by people who have seen what quoting does to a tradie&apos;s
                evenings. There&apos;s a better way.
              </p>
            </div>
            <div className="space-y-4">
              {[
                'Writing quotes at the kitchen table after the kids are in bed',
                'Losing jobs because it took 3 days to send a quote',
                'Underquoting because you forgot tip fees or plant hire',
                'Quotes that look unprofessional compared to the big operators',
                'Copy-pasting old quotes and missing crucial line items',
              ].map((pain) => (
                <div
                  key={pain}
                  className="flex items-start gap-3 rounded-lg border border-red-900/30 bg-red-950/20 p-4"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border border-red-500/40 flex items-center justify-center mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                  </div>
                  <span className="text-zinc-300 text-sm">{pain}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-gold font-medium tracking-widest uppercase mb-3">Features</div>
            <h2 className="font-display text-4xl font-bold text-white">
              Everything a tradie needs to quote faster
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Voice to quote in 60 seconds',
                desc: 'Record on your phone from the site. Whisper AI transcribes and GPT-4 builds the full quote.',
                icon: '01',
              },
              {
                title: 'Australian trade pricing',
                desc: 'AI uses realistic 2025-2026 pricing from major Australian suppliers for materials, labour, and plant hire.',
                icon: '02',
              },
              {
                title: 'Professional branded PDFs',
                desc: 'Your logo, brand colours, ABN, and licence number on every quote. Looks like it came from a big builder.',
                icon: '03',
              },
              {
                title: 'Send directly to clients',
                desc: 'Email the quote PDF directly to your client with a professional cover message. All from your phone.',
                icon: '04',
              },
              {
                title: 'Site photo analysis',
                desc: 'Attach site photos and the AI identifies terrain, access issues, and cost factors from the images.',
                icon: '05',
              },
              {
                title: 'Reusable templates',
                desc: 'Save common job types as templates. New deck quote? Start with your standard decking template.',
                icon: '06',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/8 bg-[#111318] p-6 hover:border-gold/30 transition-colors"
              >
                <div className="text-3xl font-bold text-white/8 font-display mb-3 leading-none">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-[#0a0c0f]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-sm text-gold font-medium tracking-widest uppercase mb-3">Pricing</div>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-zinc-400">14 day free trial on all plans. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Starter */}
            <div className="rounded-2xl border border-white/10 bg-[#111318] p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-1">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$49</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-zinc-400 text-sm mt-2">For sole traders quoting up to 20 jobs a month</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '20 quotes per month',
                  'Voice recording + transcription',
                  '3 site photos per quote',
                  'AI quote generation',
                  'PDF generation and email',
                  'Client directory',
                  '3 saved templates',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-app-green flex-shrink-0" />
                    {feature}
                  </li>
                ))}
                {[
                  'Custom branding (logo, colours)',
                  'Priority support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-600">
                    <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                      <div className="w-3 h-px bg-zinc-700" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=starter"
                className="block w-full text-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-medium text-white hover:bg-white/10 transition-colors"
              >
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-gold/40 bg-[#111318] p-8 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-gold px-4 py-1 text-xs font-semibold text-white">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-1">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-zinc-400">/month</span>
                </div>
                <p className="text-zinc-400 text-sm mt-2">For busy operators quoting without limits</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Unlimited quotes',
                  'Voice recording + transcription',
                  '6 site photos per quote',
                  'AI quote generation',
                  'PDF generation and email',
                  'Client directory',
                  'Unlimited templates',
                  'Custom branding (logo, colours)',
                  'Priority support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-gold flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup?plan=pro"
                className="block w-full text-center rounded-lg bg-gold px-6 py-3 font-semibold text-white hover:bg-gold-dark transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-3">
              What tradies say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  '"I used to spend Sunday night writing quotes. Now I record a voice note on the drive home and it\'s done before I\'m in the driveway. My clients think I\'ve got an office team."',
                name: 'Dave Mitchell',
                role: 'Earthworks Operator, QLD',
              },
              {
                quote:
                  '"The pricing is scarily accurate. First time I used it I thought it was too good to be true. Ran the numbers myself and it was within 3% of what I would\'ve quoted. Saved me 2 hours."',
                name: 'Sarah Chen',
                role: 'Landscaper, VIC',
              },
              {
                quote:
                  '"Won a job because I sent the quote same-day while the other bloke took three days. The client said mine looked more professional too. That\'s a $28k job I would\'ve lost."',
                name: 'Tom Hargreaves',
                role: 'Builder, NSW',
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-2xl border border-white/10 bg-[#111318] p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">{testimonial.quote}</p>
                <div>
                  <div className="font-medium text-white text-sm">{testimonial.name}</div>
                  <div className="text-zinc-500 text-xs">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-[#0a0c0f]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm text-gold font-medium tracking-widest uppercase mb-3">FAQ</div>
            <h2 className="font-display text-4xl font-bold text-white">Common questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How accurate are the AI quotes?',
                a: "They're a strong starting point using current 2025-2026 Australian pricing for materials, labour rates, and plant hire. You always review and adjust before sending — but most users find they're within 5-10% of what they'd quote manually.",
              },
              {
                q: 'What trades does it work for?',
                a: 'Builders, landscapers, earthworks operators, fencing, decking, concrete, drainage, demolition, retaining walls, and general renovation. The AI adapts its pricing and line items based on the job type.',
              },
              {
                q: 'Does it work on my phone?',
                a: 'Yes — this is a mobile-first app. The voice recording works on iPhone Safari and Android Chrome. You can record, review, and send quotes entirely from your phone at the job site.',
              },
              {
                q: 'Can I customise the PDF with my branding?',
                a: 'Pro plan includes your logo and brand colours on every quote PDF. Both plans include your business name, ABN, licence number, and contact details.',
              },
              {
                q: 'Is my data secure?',
                a: 'Yes. All data is encrypted in transit and at rest. Your quotes, client details, and voice recordings are private to your account. We use Supabase (hosted infrastructure) and do not share your data with third parties.',
              },
              {
                q: 'Can I cancel anytime?',
                a: "Yes. No lock-in contracts. Cancel anytime from your account settings. You'll keep access until the end of your billing period.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-white/10 bg-[#111318] [&[open]]:border-gold/30"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-white font-medium list-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-5 pb-5 text-zinc-400 text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-5xl font-bold text-white mb-4">
            Your next quote is{' '}
            <span className="text-gold italic">60 seconds away.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-8">
            Join hundreds of Australian tradies who quote faster and win more jobs.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-app-green px-10 py-4 text-lg font-semibold text-white hover:bg-app-green/90 transition-all hover:scale-105 shadow-lg shadow-app-green/20"
          >
            Start Free Trial
            <ChevronRight className="h-5 w-5" />
          </Link>
          <p className="text-zinc-600 text-sm mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center">
                  <span className="text-white font-bold text-xs">Q</span>
                </div>
                <span className="font-semibold text-white">QuoteSnap</span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">
                AI-powered quote generator for Australian trade businesses.
              </p>
            </div>

            <div>
              <h4 className="text-white font-medium text-sm mb-3">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'How it works', 'Templates'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium text-sm mb-3">Company</h4>
              <ul className="space-y-2">
                {['About', 'Blog', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-medium text-sm mb-3">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              &copy; {new Date().getFullYear()} QuoteSnap. All rights reserved.
            </p>
            <p className="text-zinc-700 text-sm">
              Built for Australian tradies &middot; contact@quotesnap.com.au
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
