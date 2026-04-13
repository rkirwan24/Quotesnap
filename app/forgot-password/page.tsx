'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (IS_DEMO) {
        // Demo mode — just show confirmation (no real email sent)
        await new Promise((r) => setTimeout(r, 600))
        setSent(true)
        return
      }

      const { createClient } = await import('@/lib/supabase')
      const supabase = createClient()
      const { error } = await (supabase.auth as unknown as {
        resetPasswordForEmail: (email: string, opts: object) => Promise<{ error: Error | null }>
      }).resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch {
      toast({
        title: 'Could not send reset email',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#060709] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-app-green/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-app-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
          {IS_DEMO ? (
            <p className="text-zinc-400 mb-6">
              <span className="text-gold font-medium">Demo mode:</span> No email was sent. Use your password to sign in, or{' '}
              <Link href="/signup" className="text-gold hover:text-gold-light">create a new account</Link>.
            </p>
          ) : (
            <p className="text-zinc-400 mb-6">
              We sent a password reset link to <strong className="text-white">{email}</strong>. Check your inbox.
            </p>
          )}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-2.5 text-sm font-medium text-white hover:bg-gold-dark transition-colors"
          >
            Back to sign in
          </Link>
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
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-zinc-400 mt-1">
            {IS_DEMO
              ? 'Demo mode — enter your email to continue'
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-8">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-zinc-300">Email address</Label>
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

              <Button
                type="submit"
                className="w-full bg-gold hover:bg-gold-dark text-white"
                size="lg"
                loading={loading}
              >
                {IS_DEMO ? 'Continue' : 'Send reset link'}
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-gold hover:text-gold-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
