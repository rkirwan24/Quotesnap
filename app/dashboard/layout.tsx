export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()

  let user = null
  try {
    const res = await supabase.auth.getUser()
    user = res.data?.user ?? null
  } catch {
    redirect('/login')
  }

  if (!user) redirect('/login')

  let profile = null
  try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = data
  } catch {
    // Profile fetch failed — render without profile
  }

  return (
    <div className="min-h-screen bg-background dark" style={{ colorScheme: 'dark' }}>
      <DashboardNav profile={profile} />
      <main className="md:pl-64">
        <div className="min-h-screen mobile-nav-padding">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  )
}
