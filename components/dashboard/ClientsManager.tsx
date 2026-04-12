'use client'

import { useState } from 'react'
import { Search, UserPlus, Users, Edit2, Trash2, FileText } from 'lucide-react'
import type { Client } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { createClient as createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface ClientsManagerProps {
  initialClients: Client[]
  clientQuoteData: Record<string, { count: number; total: number }>
}

const EMPTY_CLIENT: Omit<Client, 'id' | 'user_id' | 'created_at'> = {
  name: '',
  email: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  postcode: null,
  notes: null,
}

export function ClientsManager({ initialClients, clientQuoteData }: ClientsManagerProps) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<typeof EMPTY_CLIENT>(EMPTY_CLIENT)
  const [saving, setSaving] = useState(false)

  const supabase = createSupabaseClient()

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  )

  function openCreate() {
    setEditingClient(null)
    setForm(EMPTY_CLIENT)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      state: client.state,
      postcode: client.postcode,
      notes: client.notes,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingClient) {
        const { data, error } = await supabase
          .from('clients')
          .update(form)
          .eq('id', editingClient.id)
          .select()
          .single()
        if (error) throw error
        setClients((prev) => prev.map((c) => c.id === editingClient.id ? data : c))
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert({ ...form, user_id: user.id })
          .select()
          .single()
        if (error) throw error
        setClients((prev) => [...prev, data])
      }

      setDialogOpen(false)
      toast({ title: editingClient ? 'Client updated' : 'Client added' })
    } catch {
      toast({ title: 'Could not save client', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return
    try {
      await supabase.from('clients').delete().eq('id', client.id)
      setClients((prev) => prev.filter((c) => c.id !== client.id))
      toast({ title: 'Client deleted' })
    } catch {
      toast({ title: 'Could not delete client', variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clients.length} total clients</p>
        </div>
        <Button onClick={openCreate} className="bg-gold hover:bg-gold-dark">
          <UserPlus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients..."
          className="pl-9"
        />
      </div>

      {/* Client grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card text-center py-20">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">
            {search ? `No clients matching "${search}"` : 'No clients yet'}
          </h3>
          {!search && (
            <Button onClick={openCreate} className="mt-4 bg-gold hover:bg-gold-dark">
              <UserPlus className="h-4 w-4" />
              Add your first client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client) => {
            const quoteData = clientQuoteData[client.id]
            return (
              <div
                key={client.id}
                className="rounded-xl border border-border bg-card p-5 hover:border-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">{client.name}</div>
                    {client.email && (
                      <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                    )}
                    {client.phone && (
                      <div className="text-xs text-muted-foreground">{client.phone}</div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {(client.city || client.state) && (
                  <div className="text-xs text-muted-foreground mb-3">
                    {[client.city, client.state].filter(Boolean).join(', ')}
                  </div>
                )}

                {quoteData ? (
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {quoteData.count} quote{quoteData.count !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      {formatCurrency(quoteData.total)} total
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                    No quotes yet
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Edit client' : 'Add client'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="client-dialog-name">Name <span className="text-destructive">*</span></Label>
              <Input
                id="client-dialog-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Client or company name"
                className="mt-1"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="client-dialog-email">Email</Label>
                <Input
                  id="client-dialog-email"
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value || null }))}
                  placeholder="client@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-dialog-phone">Phone</Label>
                <Input
                  id="client-dialog-phone"
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value || null }))}
                  placeholder="04xx xxx xxx"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="client-dialog-address">Address</Label>
              <Input
                id="client-dialog-address"
                value={form.address || ''}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value || null }))}
                placeholder="Street address"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="client-dialog-city">Suburb</Label>
                <Input
                  id="client-dialog-city"
                  value={form.city || ''}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || null }))}
                  placeholder="Suburb"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-dialog-state">State</Label>
                <Input
                  id="client-dialog-state"
                  value={form.state || ''}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value || null }))}
                  placeholder="QLD"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="client-dialog-postcode">Postcode</Label>
                <Input
                  id="client-dialog-postcode"
                  value={form.postcode || ''}
                  onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value || null }))}
                  placeholder="4000"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || saving}
              loading={saving}
              className="bg-gold hover:bg-gold-dark"
            >
              {editingClient ? 'Save changes' : 'Add client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
