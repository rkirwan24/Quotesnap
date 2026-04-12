'use client'

import { useState } from 'react'
import { Download, Send, FileText, Save, Loader2 } from 'lucide-react'
import type { Profile, Client } from '@/types'
import { LINE_ITEM_CATEGORY_LABELS } from '@/types'
import type { QuoteFormData } from '../NewQuoteWizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateTotals, formatCurrency, formatDate, getCategoryBadgeColour } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface PreviewSendStepProps {
  formData: QuoteFormData
  profile: Profile | null
  onBack: () => void
  onSaveDraft: () => Promise<void>
  onSend: () => Promise<void>
  saving: boolean
}

export function PreviewSendStep({ formData, profile, onBack, onSaveDraft, onSend, saving }: PreviewSendStepProps) {
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState(
    (formData.clientData as Client | null)?.email || ''
  )
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const totals = calculateTotals(formData.lineItems, formData.marginPercent, formData.gstIncluded)
  const quoteDate = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, profile }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quote-${quoteDate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Could not generate PDF', variant: 'destructive' })
    } finally {
      setDownloading(false)
    }
  }

  async function handleSendEmail() {
    if (!sendEmail) return
    setSending(true)
    try {
      const res = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, profile, recipientEmail: sendEmail }),
      })
      if (!res.ok) throw new Error('Email sending failed')
      toast({ title: 'Quote sent successfully', variant: 'success' as never })
      setSendDialogOpen(false)
      await onSend()
    } catch {
      toast({ title: 'Could not send quote', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Preview and send</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Review the final quote before sending to your client.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button variant="outline" onClick={handleDownloadPDF} loading={downloading}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save as draft
        </Button>
        <Button
          onClick={() => setSendDialogOpen(true)}
          className="bg-app-green hover:bg-app-green/90"
        >
          <Send className="h-4 w-4" />
          Send to client
        </Button>
      </div>

      {/* PDF preview */}
      <div className="rounded-2xl border border-border bg-white shadow-xl overflow-hidden">
        {/* PDF Header */}
        <div className="p-8 pb-4" style={{ borderBottom: `3px solid ${profile?.brand_color || '#C9982A'}` }}>
          <div className="flex justify-between items-start">
            <div>
              <div
                className="text-2xl font-bold mb-0.5"
                style={{ color: profile?.brand_color || '#C9982A' }}
              >
                {profile?.business_name || 'My Business'}
              </div>
            </div>
            <div className="text-right text-xs text-zinc-500 leading-relaxed">
              {profile?.address && <div>{profile.address}</div>}
              {(profile?.city || profile?.state) && (
                <div>{[profile.city, profile.state, profile.postcode].filter(Boolean).join(' ')}</div>
              )}
              {profile?.phone && <div>Ph: {profile.phone}</div>}
              {profile?.email && <div>{profile.email}</div>}
              {profile?.abn && <div>ABN: {profile.abn}</div>}
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Quote info */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-3xl font-bold text-zinc-900">QUOTE</div>
              <div className="text-zinc-400 text-sm">Draft preview</div>
              <div className="mt-3 space-y-1">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Date issued</div>
                  <div className="text-sm text-zinc-700">{quoteDate}</div>
                </div>
                {formData.timeline && (
                  <div>
                    <div className="text-[10px] text-zinc-400 uppercase tracking-wider">Duration</div>
                    <div className="text-sm text-zinc-700">{formData.timeline}</div>
                  </div>
                )}
              </div>
            </div>

            {(formData.clientData as Client | null)?.name && (
              <div className="bg-zinc-50 rounded-lg p-4 max-w-xs">
                <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">Quote prepared for</div>
                <div className="font-semibold text-zinc-900">{(formData.clientData as Client | null)?.name}</div>
                {(formData.clientData as Client | null)?.address && (
                  <div className="text-xs text-zinc-500">{(formData.clientData as Client | null)?.address}</div>
                )}
                {(formData.clientData as Client | null)?.email && (
                  <div className="text-xs text-zinc-500">{(formData.clientData as Client | null)?.email}</div>
                )}
              </div>
            )}
          </div>

          {/* Site notes */}
          {formData.siteNotes && (
            <div className="bg-zinc-50 rounded-lg p-4 mb-5 text-sm text-zinc-600">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Project overview</div>
              {formData.siteNotes}
            </div>
          )}

          {/* Line items */}
          <table className="w-full mb-5 text-sm">
            <thead>
              <tr style={{ backgroundColor: profile?.brand_color || '#C9982A' }}>
                <th className="text-left px-3 py-2 text-white text-xs rounded-tl-sm">Category</th>
                <th className="text-left px-3 py-2 text-white text-xs">Description</th>
                <th className="text-right px-3 py-2 text-white text-xs">Qty</th>
                <th className="text-center px-3 py-2 text-white text-xs">Unit</th>
                <th className="text-right px-3 py-2 text-white text-xs">Unit Price</th>
                <th className="text-right px-3 py-2 text-white text-xs rounded-tr-sm">Total</th>
              </tr>
            </thead>
            <tbody>
              {formData.lineItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? 'bg-zinc-50' : ''}>
                  <td className="px-3 py-2 text-xs text-zinc-400">
                    {LINE_ITEM_CATEGORY_LABELS[item.category]}
                  </td>
                  <td className="px-3 py-2 text-zinc-700">{item.description}</td>
                  <td className="px-3 py-2 text-right text-zinc-600">{item.quantity}</td>
                  <td className="px-3 py-2 text-center text-zinc-500 text-xs">{item.unit}</td>
                  <td className="px-3 py-2 text-right text-zinc-600">{formatCurrency(item.unit_price)}</td>
                  <td className="px-3 py-2 text-right font-medium text-zinc-800">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64">
              <div className="flex justify-between py-1.5 text-sm border-b border-zinc-100">
                <span className="text-zinc-500">Subtotal</span>
                <span className="text-zinc-700">{formatCurrency(totals.subtotal)}</span>
              </div>
              {formData.gstIncluded && (
                <div className="flex justify-between py-1.5 text-sm border-b border-zinc-100">
                  <span className="text-zinc-500">GST (10%)</span>
                  <span className="text-zinc-700">{formatCurrency(totals.gstAmount)}</span>
                </div>
              )}
              <div
                className="flex justify-between py-2 px-3 rounded-md mt-1 font-bold"
                style={{ backgroundColor: profile?.brand_color || '#C9982A' }}
              >
                <span className="text-white text-sm">
                  Total {formData.gstIncluded ? '(Inc. GST)' : '(Ex. GST)'}
                </span>
                <span className="text-white">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Text sections */}
          {[
            { label: 'Scope of works', value: formData.scopeOfWork },
            { label: 'Exclusions', value: formData.exclusions },
            { label: 'Assumptions', value: formData.assumptions },
          ].filter((s) => s.value).map((section) => (
            <div key={section.label} className="mb-4">
              <div
                className="text-xs font-semibold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: profile?.brand_color || '#C9982A', borderColor: '#e5e7eb' }}
              >
                {section.label}
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed whitespace-pre-line">{section.value}</p>
            </div>
          ))}

          {/* Payment terms */}
          {formData.paymentTerms && (
            <div className="mb-6">
              <div
                className="text-xs font-semibold uppercase tracking-wider pb-1 mb-2 border-b"
                style={{ color: profile?.brand_color || '#C9982A', borderColor: '#e5e7eb' }}
              >
                Payment terms
              </div>
              <p className="text-xs text-zinc-600">{formData.paymentTerms}</p>
            </div>
          )}

          {/* Signature */}
          <div className="flex justify-between mt-8 pt-4 border-t border-zinc-100">
            <div className="w-48">
              <div className="border-b border-zinc-300 pb-4 mb-1" />
              <div className="text-xs text-zinc-400">Client signature</div>
              <div className="text-xs text-zinc-400 mt-1">Date: _______________</div>
            </div>
            <div className="w-48">
              <div className="border-b border-zinc-300 pb-4 mb-1" />
              <div className="text-xs text-zinc-400">Authorised by {profile?.business_name}</div>
              <div className="text-xs text-zinc-400 mt-1">Date: _______________</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 border-t border-zinc-100 flex justify-between text-[10px] text-zinc-400">
          <span>
            {profile?.business_name}
            {profile?.abn ? ` | ABN ${profile.abn}` : ''}
            {profile?.license_number ? ` | Lic. ${profile.license_number}` : ''}
          </span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      {/* Send dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send quote to client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="send-email">Client email address</Label>
              <Input
                id="send-email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="client@example.com"
                className="mt-1.5"
                required
              />
            </div>
            <div className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
              The quote PDF will be attached to a professional email from your business.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={!sendEmail || sending}
              loading={sending}
              className="bg-app-green hover:bg-app-green/90"
            >
              Send quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
