import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createLocalServerClient } from './local/server-client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const IS_LOCAL = !SUPABASE_URL || SUPABASE_URL === 'https://placeholder.supabase.co'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createServerSupabaseClient(): Promise<SupabaseClient<any, 'public', any>> {
  if (IS_LOCAL) {
    const client = await createLocalServerClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return client as unknown as SupabaseClient<any, 'public', any>
  }

  const cookieStore = await cookies()

  return createServerClient(
    SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          } catch {
            // Server component — read-only
          }
        },
      },
    }
  )
}
