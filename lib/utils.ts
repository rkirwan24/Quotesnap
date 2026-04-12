import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateLong(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function formatABN(abn: string): string {
  const digits = abn.replace(/\D/g, '')
  if (digits.length !== 11) return abn
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('04')) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
  }
  return phone
}

export function generateQuoteNumber(count: number): string {
  return `QS-${String(count).padStart(3, '0')}`
}

export function calculateTotals(
  lineItems: { quantity: number; unit_price: number }[],
  marginPercent: number,
  gstIncluded: boolean
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const marginAmount = subtotal * (marginPercent / 100)
  const subtotalWithMargin = subtotal + marginAmount
  const gstAmount = gstIncluded ? subtotalWithMargin * 0.1 : 0
  const total = subtotalWithMargin + gstAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    marginAmount: Math.round(marginAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export function getQuoteStatusColour(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-zinc-700 text-zinc-200'
    case 'sent':
      return 'bg-blue-900/50 text-blue-300'
    case 'accepted':
      return 'bg-green-900/50 text-green-300'
    case 'declined':
      return 'bg-red-900/50 text-red-300'
    case 'expired':
      return 'bg-orange-900/50 text-orange-300'
    default:
      return 'bg-zinc-700 text-zinc-200'
  }
}

export function getCategoryColour(category: string): string {
  switch (category) {
    case 'materials':
      return 'text-blue-400'
    case 'labour':
      return 'text-green-400'
    case 'plant_hire':
      return 'text-orange-400'
    case 'subcontractor':
      return 'text-purple-400'
    case 'disposal':
      return 'text-red-400'
    case 'permits':
      return 'text-yellow-400'
    default:
      return 'text-zinc-400'
  }
}

export function getCategoryBadgeColour(category: string): string {
  switch (category) {
    case 'materials':
      return 'bg-blue-900/40 text-blue-300 border-blue-800'
    case 'labour':
      return 'bg-green-900/40 text-green-300 border-green-800'
    case 'plant_hire':
      return 'bg-orange-900/40 text-orange-300 border-orange-800'
    case 'subcontractor':
      return 'bg-purple-900/40 text-purple-300 border-purple-800'
    case 'disposal':
      return 'bg-red-900/40 text-red-300 border-red-800'
    case 'permits':
      return 'bg-yellow-900/40 text-yellow-300 border-yellow-800'
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function getFirstName(name: string | null): string {
  if (!name) return 'there'
  return name.split(' ')[0]
}
