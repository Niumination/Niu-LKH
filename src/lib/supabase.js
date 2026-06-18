import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const isAvailable = !!(supabaseUrl && supabaseAnonKey)

if (!isAvailable) {
  console.warn('[Supabase] VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan.')
  console.warn('[Supabase] Fitur cloud backup tidak aktif.')
}

/**
 * Create Supabase client with fail-safe.
 * Jika env vars tidak tersedia, return mock object agar tidak crash runtime.
 */
function createSafeClient() {
  if (isAvailable) {
    return createClient(supabaseUrl, supabaseAnonKey)
  }

  // Mock/noop client — semua method return empty result
  const noop = () => Promise.resolve({ data: null, error: null })
  const mockQuery = new Proxy({}, {
    get: () => mockQuery,
    apply: () => mockQuery,
  })

  return {
    from: () => ({
      select: () => ({
        order: () => ({ data: [], error: null }),
        eq: () => ({ data: null, error: null, single: noop }),
      }),
      insert: () => ({ select: () => ({ data: null, error: null }) }),
      upsert: noop,
      delete: () => ({ eq: () => noop() }),
    }),
    auth: {
      getSession: noop,
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
}

export const supabase = createSafeClient()
export { isAvailable as supabaseAvailable }
