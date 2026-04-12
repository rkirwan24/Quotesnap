import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate, getFirstName, getQuoteStatusColour, truncate } from '@/lib/utils'
import { FilePlus, TrendingUp, FileText, CheckCircle, DollarSign } from 'lucide-react'
import type { Quote } from '@/types'
import { QUOTE_STATUS_LABELS } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, quotesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('quotes')
      .select('*, client:clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const profile = profileRes.data
  const recentQuotes = (quotesRes.data || []) as (Quote & { client: { name: string } | null })[]

  // Stats
  const allQuotesRes = await supabase
    .from('quotes')
    .select('total, status, created_at')
    .eq('user_id', user.id)

  const allQuotes = allQuotesRes.data || []
  const now = new Date()
  const thisMonthQuotes = allQuotes.filter((q) => {
    const d = new Date(q.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalQuoted = allQuotes.reduce((sum, q) => sum + (q.total || 0), 0)
  const acceptedQuotes = allQuotes.filter((q) => q.status === 'accepted')
  const sentOrClosedQuotes = allQuotes.filter((q) =>
    ['sent', 'accepted', 'declined'].includes(q.status)
  )
  const acceptanceRate =
    sentOrClosedQuotes.length > 0
      ? Math.round((acceptedQuotes.length / sentOrClosedQuotes.length) * 100)
      : 0
  const avgValue =
    allQuotes.length > 0 ? totalQuoted / allQuotes.length : 0

  const firstName = getFirstName(profile?.contact_name)
  const isTrialing = profile?.subscription_status === 'trial'

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            G&apos;day, {firstName}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link
          href="/dashboard/new-quote"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-dark transition-colors shadow"
        >
          <FilePlus className="h-4 w-4" />
          New Quote
        </Link>
      </div>

      {/* Trial banner */}
      {isTrialing && profile?.trial_ends_at && (
        <div className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-gold font-medium text-sm">
              Trial ends {formatDate(profile.trial_ends_at)}
            </p>
            <p className="text-zinc-400 text-xs mt-0.5">
              Upgrade to keep quoting after your trial ends
            </p>
          </div>
          <Link
            href="/dashboard/settings?tab=subscription"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
          >
            Upgrade
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Quotes this month',
            value: thisMonthQuotes.length,
            icon: FileText,
            colour: 'text-blue-400',
            bg: 'bg-blue-900/20',
          },
          {
            label: 'Total quoted',
            value: formatCurrency(totalQuoted),
            icon: DollarSign,
            colour: 'text-gold',
            bg: 'bg-gold/10',
          },
          {
            label: 'Acceptance rate',
            value: `${acceptanceRate}%`,
            icon: CheckCircle,
            colour: 'text-app-green',
            bg: 'bg-app-green/10',
          },
          {
            label: 'Avg quote value',
            value: formatCurrency(avgValue),
            icon: TrendingUp,
            colour: 'text-purple-400',
            bg: 'bg-purple-900/20',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`h-4.5 w-4.5 ${stat.colour}`} />
            </div>
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent quotes */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Recent quotes</h2>
          <Link href="/dashboard/quotes" className="text-sm text-gold hover:text-gold-light">
            View all
          </Link>
        </div>

        {recentQuotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">No quotes yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first quote to see it here
            </p>
            <Link
              href="/dashboard/new-quote"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
            >
              <FilePlus className="h-4 w-4" />
              Create first quote
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {quote.quote_number}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getQuoteStatusColour(quote.status)}`}
                    >
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {quote.client?.name || 'No client'}
                    {quote.job_type && (
                      <span className="ml-2 text-zinc-600">&middot; {quote.job_type.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-foreground">
                    {formatCurrency(quote.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
