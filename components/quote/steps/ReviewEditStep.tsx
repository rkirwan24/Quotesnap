'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { LineItem, LineItemCategory } from '@/types'
import { LINE_ITEM_CATEGORY_LABELS } from '@/types'
import type { QuoteFormData } from '../NewQuoteWizard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateTotals, formatCurrency, getCategoryBadgeColour } from '@/lib/utils'
import { v4 as uuidv4 } from 'uuid'

interface ReviewEditStepProps {
  formData: QuoteFormData
  onUpdate: (updates: Partial<QuoteFormData>) => void
  onBack: () => void
  onNext: () => void
}

const UNITS = ['m²', 'm³', 'lm', 'hrs', 'days', 'each', 'load', 'tonne', 'allow', 'item']
const CATEGORIES: LineItemCategory[] = ['materials', 'labour', 'plant_hire', 'subcontractor', 'disposal', 'permits', 'other']

export function ReviewEditStep({ formData, onUpdate, onBack, onNext }: ReviewEditStepProps) {
  const totals = calculateTotals(formData.lineItems, formData.marginPercent, formData.gstIncluded)

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    const updated = formData.lineItems.map((item) => {
      if (item.id !== id) return item
      const newItem = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        newItem.total = Number(newItem.quantity) * Number(newItem.unit_price)
      }
      return newItem
    })
    onUpdate({ lineItems: updated })
  }

  function addLineItem() {
    const newItem: LineItem = {
      id: uuidv4(),
      category: 'other',
      description: '',
      quantity: 1,
      unit: 'each',
      unit_price: 0,
      total: 0,
    }
    onUpdate({ lineItems: [...formData.lineItems, newItem] })
  }

  function removeLineItem(id: string) {
    onUpdate({ lineItems: formData.lineItems.filter((item) => item.id !== id) })
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Review and edit</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Check the AI-generated quote, adjust any line items, and set your margin.
        </p>
      </div>

      {/* Site notes */}
      {formData.siteNotes && (
        <div className="rounded-xl border border-border bg-card p-4 mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Site assessment</label>
          <p className="text-sm text-foreground mt-1 leading-relaxed">{formData.siteNotes}</p>
        </div>
      )}

      {/* Line items */}
      <div className="rounded-xl border border-border overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground text-sm">Line items</h3>
          <span className="text-xs text-muted-foreground">{formData.lineItems.length} items</span>
        </div>

        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_2fr_80px_80px_100px_100px_40px] gap-2 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
          <span>Category</span>
          <span>Description</span>
          <span className="text-center">Qty</span>
          <span className="text-center">Unit</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        {/* Line item rows */}
        <div className="divide-y divide-border">
          {formData.lineItems.map((item) => (
            <div key={item.id} className="p-3 sm:p-0">
              {/* Mobile layout */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateLineItem(item.id, 'category', v)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{LINE_ITEM_CATEGORY_LABELS[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button onClick={() => removeLineItem(item.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  placeholder="Description"
                  className="h-8 text-sm"
                />
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-center"
                    min="0"
                    step="0.1"
                  />
                  <Select
                    value={item.unit}
                    onValueChange={(v) => updateLineItem(item.id, 'unit', v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs text-right"
                    min="0"
                    step="5"
                  />
                </div>
                <div className="text-right text-sm font-semibold text-foreground">
                  {formatCurrency(item.total)}
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden sm:grid grid-cols-[1fr_2fr_80px_80px_100px_100px_40px] gap-2 px-4 py-2 items-center">
                <Select
                  value={item.category}
                  onValueChange={(v) => updateLineItem(item.id, 'category', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{LINE_ITEM_CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  className="h-7 text-xs"
                />

                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs text-center"
                  min="0"
                  step="0.1"
                />

                <Select
                  value={item.unit}
                  onValueChange={(v) => updateLineItem(item.id, 'unit', v)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs text-right"
                  min="0"
                  step="5"
                />

                <div className="text-xs font-semibold text-foreground text-right pr-1">
                  {formatCurrency(item.total)}
                </div>

                <button
                  onClick={() => removeLineItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={addLineItem}
            className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add line item
          </button>
        </div>
      </div>

      {/* Totals + margin */}
      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        {/* Margin */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Margin & GST</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Margin %</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.marginPercent}
                  onChange={(e) => onUpdate({ marginPercent: Number(e.target.value) })}
                  className="flex-1 accent-gold"
                />
                <Input
                  type="number"
                  value={formData.marginPercent}
                  onChange={(e) => onUpdate({ marginPercent: Number(e.target.value) })}
                  className="w-16 h-7 text-xs text-center"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="gst-included"
                checked={formData.gstIncluded}
                onChange={(e) => onUpdate({ gstIncluded: e.target.checked })}
                className="accent-gold"
              />
              <label htmlFor="gst-included" className="text-sm text-foreground">
                Include GST (10%)
              </label>
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground text-sm mb-3">Quote totals</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {formData.marginPercent > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Margin ({formData.marginPercent}%)</span>
                <span>{formatCurrency(totals.marginAmount)}</span>
              </div>
            )}
            {formData.gstIncluded && (
              <div className="flex justify-between text-muted-foreground">
                <span>GST (10%)</span>
                <span>{formatCurrency(totals.gstAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground text-base border-t border-border pt-2 mt-2">
              <span>Total {formData.gstIncluded ? '(inc. GST)' : '(ex. GST)'}</span>
              <span className="text-gold">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Text sections */}
      <div className="space-y-4 mb-6">
        {[
          { key: 'scopeOfWork' as const, label: 'Scope of work' },
          { key: 'exclusions' as const, label: 'Exclusions' },
          { key: 'assumptions' as const, label: 'Assumptions' },
          { key: 'timeline' as const, label: 'Timeline' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{label}</label>
            <Textarea
              value={formData[key]}
              onChange={(e) => onUpdate({ [key]: e.target.value })}
              rows={3}
              className="text-sm"
            />
          </div>
        ))}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Payment terms</label>
            <Input
              value={formData.paymentTerms}
              onChange={(e) => onUpdate({ paymentTerms: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Validity (days)</label>
            <Input
              type="number"
              value={formData.validityDays}
              onChange={(e) => onUpdate({ validityDays: Number(e.target.value) })}
              min="1"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} className="bg-gold hover:bg-gold-dark">
          Preview quote
        </Button>
      </div>
    </div>
  )
}
