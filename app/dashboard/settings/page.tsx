import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SettingsManager } from '@/components/dashboard/SettingsManager'

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, templatesRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('quote_templates').select('*').eq('user_id', user.id).order('name'),
  ])

  return (
    <SettingsManager
      profile={profileRes.data}
      templates={templatesRes.data || []}
    />
  )
}
