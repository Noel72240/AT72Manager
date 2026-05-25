import { isTauri } from '@tauri-apps/api/core'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { normalizeSupabaseUrl } from '@/config/supabase-env'
import { logSupabaseDiagnostics, runSupabaseDiagnostics } from '@/services/supabase/debug'
import { withTimeout } from '@/utils/async'
import type { Database } from './types'

const DIAGNOSTICS_TIMEOUT_MS = 4_000

export type TypedSupabaseClient = SupabaseClient<Database>

let cachedClient: TypedSupabaseClient | null = null
let initPromise: Promise<TypedSupabaseClient | null> | null = null
let resolvedFetch: typeof fetch | null = null

async function resolveFetch(): Promise<typeof fetch> {
  if (resolvedFetch) return resolvedFetch

  if (isTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    resolvedFetch = tauriFetch as typeof fetch
    if (env.isDev) {
      console.info('[supabase] Fetch Tauri HTTP plugin activé')
    }
    return resolvedFetch
  }

  resolvedFetch = globalThis.fetch.bind(globalThis)
  if (env.isDev) {
    console.info('[supabase] Fetch navigateur natif')
  }
  return resolvedFetch
}

async function buildClient(): Promise<TypedSupabaseClient | null> {
  if (!env.isSupabaseConfigured) return null

  const supabaseUrl = normalizeSupabaseUrl(env.supabaseUrl)
  const customFetch = await resolveFetch()

  if (env.isDev) {
    console.info('[supabase] Initialisation client', {
      url: supabaseUrl,
      tauri: isTauri(),
      configError: env.supabaseConfigError,
    })

    try {
      const diagnostics = await withTimeout(
        runSupabaseDiagnostics(supabaseUrl, env.supabaseAnonKey, customFetch),
        DIAGNOSTICS_TIMEOUT_MS,
        'Supabase diagnostics',
      )
      logSupabaseDiagnostics(diagnostics)
    } catch (error) {
      console.warn('[supabase] Diagnostic ignoré (timeout ou erreur):', error)
    }
  }

  const isPortal = env.isPortalStandalone
  return createClient<Database>(supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: isPortal,
      storageKey: isPortal ? 'at72-portal-auth' : 'at72manager-auth',
    },
    global: {
      fetch: customFetch,
    },
  })
}

export async function ensureSupabaseClient(): Promise<TypedSupabaseClient | null> {
  if (cachedClient) return cachedClient

  if (!initPromise) {
    initPromise = buildClient().then((client) => {
      cachedClient = client
      return client
    })
  }

  return initPromise
}

export function getSupabaseClient(): TypedSupabaseClient | null {
  return cachedClient
}

export function requireSupabaseClient(): TypedSupabaseClient {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase non configuré. Définissez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY.',
    )
  }
  return client
}

export function getNormalizedSupabaseUrl(): string {
  return normalizeSupabaseUrl(env.supabaseUrl)
}
