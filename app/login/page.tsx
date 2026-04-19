'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [dbWarning, setDbWarning] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (!data.ok) setDbWarning(data.fix || data.message)
      })
      .catch(() => {})
  }, [])

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please check your email and password.'
      toast({
        title: 'Login failed',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) throw error
      setMagicLinkSent(true)
    } catch (err: unknown) {
      toast({
        title: 'Could not send magic link',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-app-green/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-app-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-zinc-400 mb-6">
            We sent a magic link to <strong className="text-white">{email}</strong>. Click the link to sign in.
          </p>
          <Button variant="ghost" onClick={() => setMagicLinkSent(false)} className="text-zinc-400">
            Use a different email
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060709] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white text-lg">QuoteSnap</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-400 mt-1">Sign in to your QuoteSnap account</p>
        </div>

        {dbWarning && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-5 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-sm font-medium mb-1">Database setup required</p>
              <p className="text-amber-200/70 text-xs leading-relaxed">{dbWarning}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-8">
          <div className="flex gap-2 mb-6 p-1 rounded-lg bg-white/5">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'password'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Password
            </button>
            <button
              onClick={() => setMode('magic')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'magic'
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Magic link
            </button>
          </div>

          <form onSubmit={mode === 'password' ? handlePasswordLogin : handleMagicLink}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>

              {mode === 'password' && (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-zinc-300">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-gold hover:text-gold-light">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-white"
                size="lg"
                loading={loading}
              >
                {mode === 'password' ? 'Sign in' : 'Send magic link'}
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-gold hover:text-gold-light">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
