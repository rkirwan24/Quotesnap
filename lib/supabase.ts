import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const IS_LOCAL = !SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any, 'public', any> {
  if (IS_LOCAL) {
    // Dynamic require so better-sqlite3 is never bundled for browser or Vercel
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createLocalBrowserClient } = require('./local/browser-client')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createLocalBrowserClient() as unknown as SupabaseClient<any, 'public', any>
  }
  return createBrowserClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
}
