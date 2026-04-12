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
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
