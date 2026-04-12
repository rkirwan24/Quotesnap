'use client'

import { useState } from 'react'
import { Search, UserPlus, Check } from 'lucide-react'
import type { Client } from '@/types'
import type { QuoteFormData } from '../NewQuoteWizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ClientStepProps {
  clients: Client[]
  formData: QuoteFormData
  onUpdate: (updates: Partial<QuoteFormData>) => void
  onNext: () => void
}

export function ClientStep({ clients, formData, onUpdate, onNext }: ClientStepProps) {
  const [search, setSearch] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
  })

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  function selectClient(client: Client) {
    onUpdate({ clientId: client.id, clientData: client, isNewClient: false })
    setShowNewForm(false)
  }

  function handleNewClient() {
    onUpdate({ clientId: null, clientData: newClient, isNewClient: true })
  }

  function canProceed() {
    if (formData.isNewClient) return !!newClient.name
    return !!formData.clientId || true // can skip client
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Select client</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Choose an existing client or add a new one. You can also skip this step.
        </p>
      </div>

      {!showNewForm ? (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="pl-9"
            />
          </div>

          {/* Client list */}
          {filtered.length > 0 && (
            <div className="rounded-xl border border-border overflow-hidden mb-4">
              {filtered.map((client) => (
                <button
                  key={client.id}
                  onClick={() => selectClient(client)}
                  className={`flex items-center justify-between w-full px-4 py-3.5 text-left border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors ${
                    formData.clientId === client.id ? 'bg-gold/10' : ''
                  }`}
                >
                  <div>
                    <div className="font-medium text-foreground text-sm">{client.name}</div>
                    {client.email && (
                      <div className="text-xs text-muted-foreground">{client.email}</div>
                    )}
                    {client.city && (
                      <div className="text-xs text-muted-foreground">
                        {[client.city, client.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                  {formData.clientId === client.id && (
                    <Check className="h-4 w-4 text-gold flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 && search && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No clients matching &quot;{search}&quot;
            </div>
          )}

          {/* Add new client */}
          <button
            onClick={() => { setShowNewForm(true); onUpdate({ clientId: null, isNewClient: true }) }}
            className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 w-full text-sm text-muted-foreground hover:text-foreground hover:border-gold/50 transition-colors mb-4"
          >
            <UserPlus className="h-4 w-4" />
            Add new client
          </button>
        </>
      ) : (
        <div className="rounded-xl border border-border p-5 mb-4">
          <h3 className="font-semibold text-foreground mb-4">New client details</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="client-name">Name <span className="text-red-400">*</span></Label>
              <Input
                id="client-name"
                value={newClient.name || ''}
                onChange={(e) => {
                  const updated = { ...newClient, name: e.target.value }
                  setNewClient(updated)
                  onUpdate({ clientData: updated })
                }}
                placeholder="Client or company name"
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={newClient.email || ''}
                  onChange={(e) => {
                    const updated = { ...newClient, email: e.target.value }
                    setNewClient(updated)
                    onUpdate({ clientData: updated })
                  }}
                  placeholder="client@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  type="tel"
                  value={newClient.phone || ''}
                  onChange={(e) => {
                    const updated = { ...newClient, phone: e.target.value }
                    setNewClient(updated)
                    onUpdate({ clientData: updated })
                  }}
                  placeholder="04xx xxx xxx"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="client-address">Address</Label>
              <Input
                id="client-address"
                value={newClient.address || ''}
                onChange={(e) => {
                  const updated = { ...newClient, address: e.target.value }
                  setNewClient(updated)
                  onUpdate({ clientData: updated })
                }}
                placeholder="Street address"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="client-city">Suburb</Label>
                <Input
                  id="client-city"
                  value={newClient.city || ''}
                  onChange={(e) => {
                    const updated = { ...newClient, city: e.target.value }
                    setNewClient(updated)
                    onUpdate({ clientData: updated })
                  }}
                  placeholder="Suburb"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-state">State</Label>
                <Input
                  id="client-state"
                  value={newClient.state || ''}
                  onChange={(e) => {
                    const updated = { ...newClient, state: e.target.value }
                    setNewClient(updated)
                    onUpdate({ clientData: updated })
                  }}
                  placeholder="QLD"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-postcode">Postcode</Label>
                <Input
                  id="client-postcode"
                  value={newClient.postcode || ''}
                  onChange={(e) => {
                    const updated = { ...newClient, postcode: e.target.value }
                    setNewClient(updated)
                    onUpdate({ clientData: updated })
                  }}
                  placeholder="4000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => { setShowNewForm(false); handleNewClient() }}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to search
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            onUpdate({ clientId: null, clientData: null, isNewClient: false })
            onNext()
          }}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip — no client
        </button>
        <Button
          onClick={onNext}
          disabled={!canProceed()}
          className="bg-gold hover:bg-gold-dark"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
