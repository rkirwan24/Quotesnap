import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate, getQuoteStatusColour, getCategoryBadgeColour } from '@/lib/utils'
import { LINE_ITEM_CATEGORY_LABELS, QUOTE_STATUS_LABELS, JOB_TYPE_LABELS } from '@/types'
import { QuoteActions } from '@/components/quote/QuoteActions'
import { ArrowLeft, Calendar, User, Briefcase } from 'lucide-react'

interface QuotePageProps {
  params: { id: string }
}

export default async function QuotePage({ params }: QuotePageProps) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [quoteRes, profileRes] = await Promise.all([
    supabase
      .from('quotes')
      .select('*, client:clients(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  if (!quoteRes.data) notFound()

  const quote = quoteRes.data
  const profile = profileRes.data
  const client = quote.client as { name: string; email: string | null; phone: string | null; address: string | null; city: string | null; state: string | null } | null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back + header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/dashboard/quotes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All quotes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{quote.quote_number}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getQuoteStatusColour(quote.status)}`}>
              {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] ?? quote.status}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {formatDate(quote.created_at)}
          </p>
        </div>
        <QuoteActions quote={quote} profile={profile} />
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left column — main content */}
        <div className="md:col-span-2 space-y-5">
          {/* Site notes */}
          {quote.site_notes && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Project overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{quote.site_notes}</p>
            </div>
          )}

          {/* Line items */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="px-5 py-3.5 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Line items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Category</th>
                    <th className="text-left px-4 py-2.5 text-xs text-muted-foreground font-medium">Description</th>
                    <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Qty</th>
                    <th className="text-center px-4 py-2.5 text-xs text-muted-foreground font-medium">Unit</th>
                    <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Unit price</th>
                    <th className="text-right px-4 py-2.5 text-xs text-muted-foreground font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(quote.line_items || []).map((item: { id: string; category: string; description: string; quantity: number; unit: string; unit_price: number; total: number }) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${getCategoryBadgeColour(item.category)}`}>
                          {LINE_ITEM_CATEGORY_LABELS[item.category as keyof typeof LINE_ITEM_CATEGORY_LABELS] || item.category}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground">{item.description}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground text-xs">{item.unit}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{formatCurrency(item.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-foreground">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-border px-5 py-4">
              <div className="flex justify-end">
                <div className="w-56 space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  {quote.margin_amount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Margin ({quote.margin_percent}%)</span>
                      <span>{formatCurrency(quote.margin_amount)}</span>
                    </div>
                  )}
                  {quote.gst_included && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>GST (10%)</span>
                      <span>{formatCurrency(quote.gst_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-gold">{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Text sections */}
          {[
            { label: 'Scope of works', value: quote.scope_of_work },
            { label: 'Exclusions', value: quote.exclusions },
            { label: 'Assumptions', value: quote.assumptions },
          ].filter((s) => s.value).map((section) => (
            <div key={section.label} className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">{section.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.value}</p>
            </div>
          ))}
        </div>

        {/* Right column — meta */}
        <div className="space-y-4">
          {/* Client */}
          {client && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Client</h3>
              </div>
              <div className="text-sm font-medium text-foreground">{client.name}</div>
              {client.email && <div className="text-xs text-muted-foreground mt-1">{client.email}</div>}
              {client.phone && <div className="text-xs text-muted-foreground">{client.phone}</div>}
              {client.address && (
                <div className="text-xs text-muted-foreground mt-1">
                  {client.address}
                  {client.city && `, ${client.city}`}
                  {client.state && ` ${client.state}`}
                </div>
              )}
            </div>
          )}

          {/* Job details */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Job details</h3>
            </div>
            <div className="space-y-2 text-sm">
              {quote.job_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground capitalize">{JOB_TYPE_LABELS[quote.job_type as keyof typeof JOB_TYPE_LABELS]}</span>
                </div>
              )}
              {quote.timeline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-foreground">{quote.timeline}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid for</span>
                <span className="text-foreground">{quote.validity_days} days</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Activity</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">{formatDate(quote.created_at)}</span>
              </div>
              {quote.sent_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="text-foreground">{formatDate(quote.sent_at)}</span>
                </div>
              )}
              {quote.accepted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span className="text-app-green">{formatDate(quote.accepted_at)}</span>
                </div>
              )}
              {quote.declined_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Declined</span>
                  <span className="text-destructive">{formatDate(quote.declined_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment terms */}
          {quote.payment_terms && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">Payment terms</h3>
              <p className="text-xs text-muted-foreground">{quote.payment_terms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
