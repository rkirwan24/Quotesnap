'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Check } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan') || 'pro'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      })
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: { full_name: name },
        },
      })
      if (error) throw error
      // Update profile with name
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          contact_name: name,
          email,
          subscription_tier: plan === 'starter' ? 'starter' : 'pro',
        })
      }
      router.push('/dashboard/settings?onboarding=true')
      router.refresh()
    } catch (err: unknown) {
      toast({
        title: 'Signup failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const planFeatures = {
    starter: ['20 quotes per month', 'Voice + AI quote generation', '3 photos per quote', '14 day free trial'],
    pro: ['Unlimited quotes', 'Voice + AI quote generation', '6 photos per quote', 'Custom branding', '14 day free trial'],
  }

  const features = planFeatures[plan as keyof typeof planFeatures] || planFeatures.pro

  return (
    <div className="min-h-screen bg-[#060709] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-semibold text-white text-lg">QuoteSnap</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Start your free trial</h1>
          <p className="text-zinc-400 mt-1">14 days free. No credit card required.</p>
        </div>

        {/* Plan badge */}
        <div className="rounded-xl border border-gold/30 bg-gold/10 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gold font-semibold capitalize">{plan === 'starter' ? 'Starter' : 'Pro'} plan trial</span>
            <span className="text-zinc-400 text-sm">{plan === 'starter' ? '$49' : '$99'}/month after trial</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-zinc-300">
                <Check className="w-3 h-3 text-gold flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111318] p-8">
          <form onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-zinc-300">Your name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dave Mitchell"
                  required
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>
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
              <div>
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-zinc-600"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-app-green hover:bg-app-green/90 text-white"
                size="lg"
                loading={loading}
              >
                Start free trial
              </Button>

              <p className="text-xs text-zinc-500 text-center">
                By signing up you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-gold hover:text-gold-light">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060709]" />}>
      <SignupForm />
    </Suspense>
  )
}
