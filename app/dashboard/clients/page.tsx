export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'
import { ClientsManager } from '@/components/dashboard/ClientsManager'

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  // Get quote counts per client
  const { data: quoteCounts } = await supabase
    .from('quotes')
    .select('client_id, total')
    .eq('user_id', user.id)
    .not('client_id', 'is', null)

  const clientQuoteData = (quoteCounts || []).reduce((acc: Record<string, { count: number; total: number }>, q) => {
    if (!q.client_id) return acc
    if (!acc[q.client_id]) acc[q.client_id] = { count: 0, total: 0 }
    acc[q.client_id].count++
    acc[q.client_id].total += q.total || 0
    return acc
  }, {})

  return (
    <ClientsManager
      initialClients={clients || []}
      clientQuoteData={clientQuoteData}
    />
  )
}
