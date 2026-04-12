export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
export type SubscriptionTier = 'starter' | 'pro'
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'
export type LineItemCategory =
  | 'materials'
  | 'labour'
  | 'plant_hire'
  | 'subcontractor'
  | 'disposal'
  | 'permits'
  | 'other'

export type JobType =
  | 'landscaping'
  | 'earthworks'
  | 'building'
  | 'renovation'
  | 'decking'
  | 'fencing'
  | 'retaining_wall'
  | 'concrete'
  | 'drainage'
  | 'demolition'
  | 'other'

export interface LineItem {
  id: string
  category: LineItemCategory
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
  is_subcontractor?: boolean
}

export interface Profile {
  id: string
  business_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  abn: string | null
  license_number: string | null
  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  logo_url: string | null
  brand_color: string
  default_margin_percent: number
  default_gst_included: boolean
  payment_terms: string
  quote_validity_days: number
  bank_details: string | null
  stripe_customer_id: string | null
  subscription_status: SubscriptionStatus
  subscription_tier: SubscriptionTier
  trial_ends_at: string | null
  quotes_this_month: number
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postcode: string | null
  notes: string | null
  created_at: string
}

export interface Quote {
  id: string
  user_id: string
  client_id: string | null
  quote_number: string
  status: QuoteStatus
  job_type: JobType | null
  job_description: string | null
  site_notes: string | null
  line_items: LineItem[]
  subtotal: number
  margin_percent: number
  margin_amount: number
  gst_amount: number
  total: number
  gst_included: boolean
  scope_of_work: string | null
  exclusions: string | null
  assumptions: string | null
  timeline: string | null
  payment_terms: string | null
  validity_days: number
  voice_note_url: string | null
  voice_transcript: string | null
  photo_urls: string[]
  photo_analysis: string | null
  pdf_url: string | null
  sent_at: string | null
  accepted_at: string | null
  declined_at: string | null
  created_at: string
  updated_at: string
  client?: Client
}

export interface QuoteTemplate {
  id: string
  user_id: string
  name: string
  job_type: JobType | null
  default_line_items: LineItem[]
  default_scope: string | null
  default_exclusions: string | null
  created_at: string
}

export interface GenerateQuoteRequest {
  transcript: string
  photoAnalysis: string
  jobType: JobType
  businessProfile: {
    business_name: string
    margin_percent: number
    gst_included: boolean
  }
  templateDefaults?: {
    default_line_items?: LineItem[]
    default_scope?: string
    default_exclusions?: string
  }
}

export interface GenerateQuoteResponse {
  site_notes: string
  line_items: LineItem[]
  scope_of_work: string
  exclusions: string
  assumptions: string
  timeline: string
}

export interface QuoteStats {
  quotes_this_month: number
  total_quoted: number
  acceptance_rate: number
  average_quote_value: number
}

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  landscaping: 'Landscaping',
  earthworks: 'Earthworks',
  building: 'Building',
  renovation: 'Renovation',
  decking: 'Decking',
  fencing: 'Fencing',
  retaining_wall: 'Retaining Wall',
  concrete: 'Concrete',
  drainage: 'Drainage',
  demolition: 'Demolition',
  other: 'Other',
}

export const LINE_ITEM_CATEGORY_LABELS: Record<LineItemCategory, string> = {
  materials: 'Materials',
  labour: 'Labour',
  plant_hire: 'Plant Hire',
  subcontractor: 'Subcontractor',
  disposal: 'Disposal',
  permits: 'Permits',
  other: 'Other',
}

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
}
