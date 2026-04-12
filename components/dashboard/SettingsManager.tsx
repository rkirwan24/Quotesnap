'use client'

import { useState, useRef } from 'react'
import { Save, Upload, ExternalLink, Loader2, CreditCard } from 'lucide-react'
import type { Profile, QuoteTemplate } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import { Toaster } from '@/components/ui/toaster'

interface SettingsManagerProps {
  profile: Profile | null
  templates: QuoteTemplate[]
}

export function SettingsManager({ profile, templates }: SettingsManagerProps) {
  const [form, setForm] = useState({
    business_name: profile?.business_name || '',
    contact_name: profile?.contact_name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    abn: profile?.abn || '',
    license_number: profile?.license_number || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    postcode: profile?.postcode || '',
    brand_color: profile?.brand_color || '#C9982A',
    default_margin_percent: profile?.default_margin_percent || 20,
    default_gst_included: profile?.default_gst_included ?? true,
    payment_terms: profile?.payment_terms || 'Payment due within 14 days of acceptance',
    quote_validity_days: profile?.quote_validity_days || 30,
    bank_details: profile?.bank_details || '',
    logo_url: profile?.logo_url || '',
  })

  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [activeTab, setActiveTab] = useState<'business' | 'branding' | 'defaults' | 'subscription'>('business')
  const logoInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: form.business_name || null,
          contact_name: form.contact_name || null,
          email: form.email || null,
          phone: form.phone || null,
          abn: form.abn || null,
          license_number: form.license_number || null,
          address: form.address || null,
          city: form.city || null,
          state: form.state || null,
          postcode: form.postcode || null,
          brand_color: form.brand_color,
          default_margin_percent: form.default_margin_percent,
          default_gst_included: form.default_gst_included,
          payment_terms: form.payment_terms || null,
          quote_validity_days: form.quote_validity_days,
          bank_details: form.bank_details || null,
          logo_url: form.logo_url || null,
        })
        .eq('id', user.id)

      if (error) throw error
      toast({ title: 'Settings saved' })
    } catch {
      toast({ title: 'Could not save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const filename = `logos/${user.id}/logo.${file.name.split('.').pop()}`
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(filename, file, { contentType: file.type, upsert: true })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(data.path)
      setForm((f) => ({ ...f, logo_url: publicUrl }))
      toast({ title: 'Logo uploaded' })
    } catch {
      toast({ title: 'Logo upload failed', variant: 'destructive' })
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleManageSubscription() {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      toast({ title: 'Could not open subscription portal', variant: 'destructive' })
    }
  }

  const TABS = [
    { id: 'business', label: 'Business profile' },
    { id: 'branding', label: 'Branding' },
    { id: 'defaults', label: 'Quote defaults' },
    { id: 'subscription', label: 'Subscription' },
  ] as const

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <Button
          onClick={handleSave}
          loading={saving}
          className="bg-gold hover:bg-gold-dark"
        >
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Business profile */}
      {activeTab === 'business' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={form.business_name}
                onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                placeholder="Mitchell Earthworks"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="contact-name">Your name</Label>
              <Input
                id="contact-name"
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                placeholder="Dave Mitchell"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="dave@mitchellearthworks.com.au"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="settings-phone">Phone</Label>
              <Input
                id="settings-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0412 345 678"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settings-abn">ABN</Label>
              <Input
                id="settings-abn"
                value={form.abn}
                onChange={(e) => setForm((f) => ({ ...f, abn: e.target.value }))}
                placeholder="51 824 753 556"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="settings-license">Licence number</Label>
              <Input
                id="settings-license"
                value={form.license_number}
                onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))}
                placeholder="BLD-123456"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="settings-address">Business address</Label>
            <Input
              id="settings-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="123 Tradie Street"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="settings-city">Suburb</Label>
              <Input
                id="settings-city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Brisbane"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="settings-state">State</Label>
              <Input
                id="settings-state"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="QLD"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="settings-postcode">Postcode</Label>
              <Input
                id="settings-postcode"
                value={form.postcode}
                onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                placeholder="4000"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Branding */}
      {activeTab === 'branding' && (
        <div className="space-y-5">
          <div>
            <Label>Business logo</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Appears on all quote PDFs. Use a PNG or SVG on a white or transparent background.
            </p>
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={form.logo_url}
                  alt="Business logo"
                  className="h-16 w-32 object-contain rounded-lg border border-border bg-white p-2"
                />
              ) : (
                <div className="h-16 w-32 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
                  No logo
                </div>
              )}
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Upload logo
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleLogoUpload}
                />
                {form.logo_url && (
                  <button
                    onClick={() => setForm((f) => ({ ...f, logo_url: '' }))}
                    className="block text-xs text-destructive mt-1.5"
                  >
                    Remove logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="brand-color">Brand colour</Label>
            <p className="text-xs text-muted-foreground mb-2">Used for PDF headers and accents.</p>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={form.brand_color}
                onChange={(e) => setForm((f) => ({ ...f, brand_color: e.target.value }))}
                className="h-10 w-16 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={form.brand_color}
                onChange={(e) => setForm((f) => ({ ...f, brand_color: e.target.value }))}
                placeholder="#C9982A"
                className="w-32"
              />
              <div
                className="flex-1 h-10 rounded-lg border border-border flex items-center justify-center text-white text-sm font-semibold"
                style={{ backgroundColor: form.brand_color }}
              >
                Preview
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Custom branding is available on the Pro plan. Starter plan quotes include your business name and contact details.
          </div>
        </div>
      )}

      {/* Quote defaults */}
      {activeTab === 'defaults' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-margin">Default margin (%)</Label>
              <p className="text-xs text-muted-foreground mb-1">Applied to all new quotes</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={form.default_margin_percent}
                  onChange={(e) => setForm((f) => ({ ...f, default_margin_percent: Number(e.target.value) }))}
                  className="flex-1 accent-gold"
                />
                <Input
                  type="number"
                  id="default-margin"
                  value={form.default_margin_percent}
                  onChange={(e) => setForm((f) => ({ ...f, default_margin_percent: Number(e.target.value) }))}
                  className="w-20"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="validity-days">Quote validity (days)</Label>
              <p className="text-xs text-muted-foreground mb-1">How long quotes remain valid</p>
              <Input
                id="validity-days"
                type="number"
                value={form.quote_validity_days}
                onChange={(e) => setForm((f) => ({ ...f, quote_validity_days: Number(e.target.value) }))}
                min="1"
                max="365"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border p-4">
            <input
              type="checkbox"
              id="default-gst"
              checked={form.default_gst_included}
              onChange={(e) => setForm((f) => ({ ...f, default_gst_included: e.target.checked }))}
              className="accent-gold h-4 w-4"
            />
            <label htmlFor="default-gst" className="text-sm text-foreground">
              Include GST (10%) by default on new quotes
            </label>
          </div>

          <div>
            <Label htmlFor="payment-terms">Default payment terms</Label>
            <Textarea
              id="payment-terms"
              value={form.payment_terms}
              onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bank-details">Bank details for payment</Label>
            <p className="text-xs text-muted-foreground mb-1">Printed on quote PDFs</p>
            <Textarea
              id="bank-details"
              value={form.bank_details}
              onChange={(e) => setForm((f) => ({ ...f, bank_details: e.target.value }))}
              placeholder="BSB: 123-456&#10;Account: 12345678&#10;Account name: Mitchell Earthworks"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Subscription */}
      {activeTab === 'subscription' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-foreground capitalize">
                  {profile?.subscription_tier || 'Starter'} plan
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  Status: {profile?.subscription_status || 'Trial'}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                profile?.subscription_status === 'active'
                  ? 'bg-app-green/20 text-app-green'
                  : profile?.subscription_status === 'trial'
                  ? 'bg-gold/20 text-gold'
                  : 'bg-destructive/20 text-destructive'
              }`}>
                {profile?.subscription_status === 'trial' ? 'Free trial' : profile?.subscription_status}
              </div>
            </div>

            {profile?.subscription_status === 'trial' && profile?.trial_ends_at && (
              <div className="text-sm text-muted-foreground mb-4">
                Trial ends on {new Date(profile.trial_ends_at).toLocaleDateString('en-AU', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="border-gold text-gold hover:bg-gold/10"
              >
                <CreditCard className="h-4 w-4" />
                Manage subscription
                <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </div>
          </div>

          {/* Plan comparison */}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-3 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-foreground text-sm">Plan features</h3>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: 'Quotes per month', starter: '20', pro: 'Unlimited' },
                { label: 'Photos per quote', starter: '3', pro: '6' },
                { label: 'Custom branding', starter: 'No', pro: 'Yes' },
                { label: 'Templates', starter: '3', pro: 'Unlimited' },
                { label: 'Priority support', starter: 'No', pro: 'Yes' },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-3 px-5 py-3 text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`text-center ${profile?.subscription_tier === 'starter' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {row.starter}
                  </span>
                  <span className={`text-center ${profile?.subscription_tier === 'pro' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {row.pro}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          loading={saving}
          className="bg-gold hover:bg-gold-dark"
        >
          <Save className="h-4 w-4" />
          Save changes
        </Button>
      </div>
    </div>
  )
}
