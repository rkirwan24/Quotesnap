export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NewQuoteWizard } from '@/components/quote/NewQuoteWizard'

export default async function NewQuotePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, clientsRes, templatesRes, quoteCountRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('clients').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quote_templates').select('*').eq('user_id', user.id).order('name'),
    supabase.from('quotes').select('id', { count: 'exact' }).eq('user_id', user.id),
  ])

  const profile = profileRes.data
  const clients = clientsRes.data || []
  const templates = templatesRes.data || []
  const quoteCount = quoteCountRes.count || 0

  return (
    <NewQuoteWizard
      profile={profile}
      clients={clients}
      templates={templates}
      quoteCount={quoteCount}
    />
  )
}
