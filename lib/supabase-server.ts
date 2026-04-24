import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
// Treat as local if URL is missing, a placeholder, or not a real https:// URL
const IS_LOCAL =
  !SUPABASE_URL ||
  !SUPABASE_URL.startsWith('https://') ||
  SUPABASE_URL === 'https://placeholder.supabase.co'

async function localClient() {
  const { createLocalServerClient } = await import('./local/server-client')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createLocalServerClient()) as unknown as SupabaseClient<any, 'public', any>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createServerSupabaseClient(): Promise<SupabaseClient<any, 'public', any>> {
  if (IS_LOCAL) return localClient()

  try {
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
  } catch {
    // Supabase client init failed (e.g. invalid URL env var) — fall back to local auth
    return localClient()
  }
}
