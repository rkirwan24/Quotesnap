'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/new-quote', label: 'New Quote', icon: FilePlus },
  { href: '/dashboard/quotes', label: 'All Quotes', icon: FileText },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

interface DashboardNavProps {
  profile: Profile | null
}

export function DashboardNav({ profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-gold/15 text-gold'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
            )}
          >
            <item.icon className="h-4 w-4 flex-shrink-0" />
            {item.label}
            {item.href === '/dashboard/new-quote' && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
                +
              </span>
            )}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-border bg-card z-40">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">Q</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">QuoteSnap</span>
            {profile?.subscription_status === 'trial' && (
              <div className="text-[10px] text-gold">Trial</div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* Profile footer */}
        <div className="border-t border-border px-3 py-3">
          {profile?.business_name && (
            <div className="px-3 py-2 mb-1">
              <div className="text-xs font-medium text-foreground truncate">
                {profile.business_name}
              </div>
              <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center">
            <span className="text-white font-bold text-xs">Q</span>
          </div>
          <span className="font-semibold text-foreground">QuoteSnap</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:bg-white/5"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-72 bg-card border-l border-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-14 flex items-center px-4 border-b border-border">
              <span className="font-semibold text-foreground">Menu</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="border-t border-border px-3 py-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex">
        {navItems.slice(0, 4).map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-1 transition-colors',
                isActive ? 'text-gold' : 'text-zinc-500'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-2 text-xs gap-1',
            pathname.startsWith('/dashboard/settings') ? 'text-gold' : 'text-zinc-500'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Mobile top bar spacing */}
      <div className="md:hidden h-14" />
    </>
  )
}
