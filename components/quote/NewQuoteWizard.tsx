'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, Client, QuoteTemplate, LineItem, JobType, GenerateQuoteResponse } from '@/types'
import { JOB_TYPE_LABELS } from '@/types'
import { calculateTotals, generateQuoteNumber } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { ClientStep } from './steps/ClientStep'
import { VoicePhotoStep } from './steps/VoicePhotoStep'
import { GeneratingStep } from './steps/GeneratingStep'
import { ReviewEditStep } from './steps/ReviewEditStep'
import { PreviewSendStep } from './steps/PreviewSendStep'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase'

const STEPS = [
  { id: 1, label: 'Client' },
  { id: 2, label: 'Voice + Photos' },
  { id: 3, label: 'Generating' },
  { id: 4, label: 'Review' },
  { id: 5, label: 'Send' },
]

export interface QuoteFormData {
  // Step 1
  clientId: string | null
  clientData: Partial<Client> | null
  isNewClient: boolean

  // Step 2
  jobType: JobType
  voiceTranscript: string
  voiceNoteUrl: string | null
  photoUrls: string[]
  photoAnalysis: string
  templateId: string | null

  // Step 3/4 - Generated data
  siteNotes: string
  lineItems: LineItem[]
  scopeOfWork: string
  exclusions: string
  assumptions: string
  timeline: string
  marginPercent: number
  gstIncluded: boolean
  paymentTerms: string
  validityDays: number
}

interface NewQuoteWizardProps {
  profile: Profile | null
  clients: Client[]
  templates: QuoteTemplate[]
  quoteCount: number
}

export function NewQuoteWizard({ profile, clients, templates, quoteCount }: NewQuoteWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState<QuoteFormData>({
    clientId: null,
    clientData: null,
    isNewClient: false,
    jobType: 'landscaping',
    voiceTranscript: '',
    voiceNoteUrl: null,
    photoUrls: [],
    photoAnalysis: '',
    templateId: null,
    siteNotes: '',
    lineItems: [],
    scopeOfWork: '',
    exclusions: '',
    assumptions: '',
    timeline: '',
    marginPercent: profile?.default_margin_percent || 20,
    gstIncluded: profile?.default_gst_included ?? true,
    paymentTerms: profile?.payment_terms || 'Payment due within 14 days of acceptance',
    validityDays: profile?.quote_validity_days || 30,
  })

  function updateFormData(updates: Partial<QuoteFormData>) {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  async function handleGenerate() {
    setStep(3)
    try {
      const selectedTemplate = templates.find((t) => t.id === formData.templateId)
      const response = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: formData.voiceTranscript,
          photoAnalysis: formData.photoAnalysis,
          jobType: formData.jobType,
          businessProfile: {
            business_name: profile?.business_name || 'My Business',
            margin_percent: formData.marginPercent,
            gst_included: formData.gstIncluded,
          },
          templateDefaults: selectedTemplate
            ? {
                default_line_items: selectedTemplate.default_line_items,
                default_scope: selectedTemplate.default_scope,
                default_exclusions: selectedTemplate.default_exclusions,
              }
            : undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Quote generation failed')
      }

      const generated: GenerateQuoteResponse = await response.json()
      const lineItemsWithIds = generated.line_items.map((item) => ({
        ...item,
        id: item.id || uuidv4(),
        total: item.quantity * item.unit_price,
      }))

      updateFormData({
        siteNotes: generated.site_notes,
        lineItems: lineItemsWithIds,
        scopeOfWork: generated.scope_of_work,
        exclusions: generated.exclusions,
        assumptions: generated.assumptions,
        timeline: generated.timeline,
      })
      setStep(4)
    } catch (err: unknown) {
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
      setStep(2)
    }
  }

  async function saveQuote(status: 'draft' | 'sent') {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let clientId = formData.clientId

      // Create new client if needed
      if (formData.isNewClient && formData.clientData?.name) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({ ...formData.clientData, user_id: user.id })
          .select()
          .single()
        if (clientError) throw clientError
        clientId = newClient.id
      }

      const totals = calculateTotals(
        formData.lineItems,
        formData.marginPercent,
        formData.gstIncluded
      )

      const quoteNumber = generateQuoteNumber(quoteCount + 1)

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          user_id: user.id,
          client_id: clientId,
          quote_number: quoteNumber,
          status,
          job_type: formData.jobType,
          job_description: formData.voiceTranscript,
          site_notes: formData.siteNotes,
          line_items: formData.lineItems,
          subtotal: totals.subtotal,
          margin_percent: formData.marginPercent,
          margin_amount: totals.marginAmount,
          gst_amount: totals.gstAmount,
          total: totals.total,
          gst_included: formData.gstIncluded,
          scope_of_work: formData.scopeOfWork,
          exclusions: formData.exclusions,
          assumptions: formData.assumptions,
          timeline: formData.timeline,
          payment_terms: formData.paymentTerms,
          validity_days: formData.validityDays,
          voice_note_url: formData.voiceNoteUrl,
          voice_transcript: formData.voiceTranscript,
          photo_urls: formData.photoUrls,
          photo_analysis: formData.photoAnalysis,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        })
        .select()
        .single()

      if (quoteError) throw quoteError

      // Update quote count (best-effort)
      supabase
        .from('profiles')
        .select('quotes_this_month')
        .eq('id', user.id)
        .single()
        .then(({ data: p }) => {
          if (p) {
            supabase
              .from('profiles')
              .update({ quotes_this_month: (p.quotes_this_month || 0) + 1 })
              .eq('id', user.id)
              .then(() => {})
          }
        })

      toast({
        title: status === 'draft' ? 'Quote saved as draft' : 'Quote saved',
        variant: 'success' as never,
      })

      router.push(`/dashboard/quotes/${quote.id}`)
    } catch (err: unknown) {
      toast({
        title: 'Could not save quote',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Steps header */}
      <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground mb-3">New Quote</h1>
          <div className="flex gap-1">
            {STEPS.filter((s) => s.id !== 3).map((s, i) => {
              const displayStep = i + 1
              const realStep = s.id
              const isCurrent = step === realStep || (step === 3 && realStep === 2)
              const isComplete = step > realStep || (step === 3 && realStep < 3) || (step > 3 && realStep <= 2)
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isCurrent
                        ? 'bg-gold text-white'
                        : isComplete
                        ? 'bg-app-green/20 text-app-green'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px]">
                      {isComplete ? '✓' : displayStep}
                    </span>
                    <span className="hidden sm:block">{s.label}</span>
                  </div>
                  {i < 3 && (
                    <div className={`h-px w-4 ${isComplete ? 'bg-app-green/40' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {step === 1 && (
          <ClientStep
            clients={clients}
            formData={formData}
            onUpdate={updateFormData}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <VoicePhotoStep
            profile={profile}
            templates={templates}
            formData={formData}
            onUpdate={updateFormData}
            onBack={() => setStep(1)}
            onGenerate={handleGenerate}
          />
        )}
        {step === 3 && <GeneratingStep />}
        {step === 4 && (
          <ReviewEditStep
            formData={formData}
            onUpdate={updateFormData}
            onBack={() => setStep(2)}
            onNext={() => setStep(5)}
          />
        )}
        {step === 5 && (
          <PreviewSendStep
            formData={formData}
            profile={profile}
            onBack={() => setStep(4)}
            onSaveDraft={() => saveQuote('draft')}
            onSend={() => saveQuote('sent')}
            saving={saving}
          />
        )}
      </div>
    </div>
  )
}
