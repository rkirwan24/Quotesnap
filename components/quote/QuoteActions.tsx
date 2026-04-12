'use client'

import { useState } from 'react'
import { Download, Send, Loader2, MoreHorizontal, Check, X } from 'lucide-react'
import type { Quote, Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface QuoteActionsProps {
  quote: Quote
  profile: Profile | null
}

export function QuoteActions({ quote, profile }: QuoteActionsProps) {
  const router = useRouter()
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [sendEmail, setSendEmail] = useState(quote.client?.email || '')
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quote.quote_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Could not generate PDF', variant: 'destructive' })
    } finally {
      setDownloading(false)
    }
  }

  async function handleSend() {
    if (!sendEmail) return
    setSending(true)
    try {
      const res = await fetch('/api/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id, recipientEmail: sendEmail }),
      })
      if (!res.ok) throw new Error('Failed to send')

      // Update status
      const supabase = createClient()
      await supabase
        .from('quotes')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', quote.id)

      toast({ title: 'Quote sent successfully' })
      setSendDialogOpen(false)
      router.refresh()
    } catch {
      toast({ title: 'Could not send quote', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  async function updateStatus(status: string) {
    setUpdatingStatus(true)
    try {
      const supabase = createClient()
      const updates: Record<string, string | null> = { status }
      if (status === 'accepted') updates.accepted_at = new Date().toISOString()
      if (status === 'declined') updates.declined_at = new Date().toISOString()

      await supabase.from('quotes').update(updates).eq('id', quote.id)
      router.refresh()
    } catch {
      toast({ title: 'Could not update status', variant: 'destructive' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {quote.status === 'sent' && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-app-green/30 text-app-green hover:bg-app-green/10"
            onClick={() => updateStatus('accepted')}
            disabled={updatingStatus}
          >
            <Check className="h-3.5 w-3.5" />
            Accepted
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-800 text-red-400 hover:bg-red-900/20"
            onClick={() => updateStatus('declined')}
            disabled={updatingStatus}
          >
            <X className="h-3.5 w-3.5" />
            Declined
          </Button>
        </>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={downloading}
      >
        {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Download</span>
      </Button>

      <Button
        size="sm"
        className="bg-gold hover:bg-gold-dark"
        onClick={() => setSendDialogOpen(true)}
      >
        <Send className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Send</span>
      </Button>

      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send {quote.quote_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="quote-send-email">Client email address</Label>
              <Input
                id="quote-send-email"
                type="email"
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="client@example.com"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSend}
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
