import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLocalBrowserClient } from './local/browser-client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const IS_LOCAL = !SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any, 'public', any> {
  if (IS_LOCAL) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createLocalBrowserClient() as unknown as SupabaseClient<any, 'public', any>
  }
  return createBrowserClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
}
