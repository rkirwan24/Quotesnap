export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatCurrency, formatDate, getQuoteStatusColour } from '@/lib/utils'
import { FilePlus, FileText } from 'lucide-react'
import type { Quote } from '@/types'
import { QUOTE_STATUS_LABELS, JOB_TYPE_LABELS } from '@/types'

export default async function QuotesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, client:clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allQuotes = (quotes || []) as (Quote & { client: { name: string } | null })[]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All quotes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{allQuotes.length} total quotes</p>
        </div>
        <Link
          href="/dashboard/new-quote"
          className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-dark transition-colors"
        >
          <FilePlus className="h-4 w-4" />
          New Quote
        </Link>
      </div>

      {allQuotes.length === 0 ? (
        <div className="rounded-xl border border-border bg-card text-center py-20">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No quotes yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Create your first quote to see it here</p>
          <Link
            href="/dashboard/new-quote"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
          >
            <FilePlus className="h-4 w-4" />
            Create first quote
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quote #
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Job type
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allQuotes.map((quote) => (
                  <tr
                    key={quote.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="font-medium text-foreground hover:text-gold">
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {quote.client?.name || <span className="italic text-zinc-600">No client</span>}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground capitalize">
                      {quote.job_type ? JOB_TYPE_LABELS[quote.job_type] : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">
                      {formatCurrency(quote.total)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${getQuoteStatusColour(quote.status)}`}
                      >
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground text-xs">
                      {formatDate(quote.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden divide-y divide-border">
            {allQuotes.map((quote) => (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{quote.quote_number}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getQuoteStatusColour(quote.status)}`}>
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {quote.client?.name || 'No client'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-foreground text-sm">{formatCurrency(quote.total)}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
