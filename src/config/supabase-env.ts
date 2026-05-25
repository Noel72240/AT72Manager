/**
 * Extrait le project ref Supabase depuis une clé anon JWT (legacy).
 */
export function getSupabaseRefFromAnonKey(anonKey: string): string | null {
  if (isPublishableKey(anonKey)) return null

  try {
    const payload = anonKey.split('.')[1]
    if (!payload) return null
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      ref?: string
    }
    return json.ref ?? null
  } catch {
    return null
  }
}

export function isPublishableKey(key: string): boolean {
  return key.startsWith('sb_publishable_')
}

export function isLegacyAnonKey(key: string): boolean {
  return key.startsWith('eyJ')
}

export function isValidSupabaseKey(key: string): boolean {
  return isPublishableKey(key) || isLegacyAnonKey(key)
}

/**
 * Extrait le project ref depuis l'URL Supabase.
 */
export function getSupabaseRefFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    const match = hostname.match(/^([^.]+)\.supabase\.co$/)
    return match?.[1] ?? null
  } catch {
    return null
  }
}

export function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1\/?$/, '')
}

export function validateSupabaseEnv(url: string, anonKey: string): string | null {
  const normalizedUrl = normalizeSupabaseUrl(url)
  const urlRef = getSupabaseRefFromUrl(normalizedUrl)
  const keyRef = getSupabaseRefFromAnonKey(anonKey)

  if (!urlRef) return 'URL Supabase invalide.'
  if (!isValidSupabaseKey(anonKey)) {
    return 'Clé API Supabase invalide. Utilisez la clé publishable ou anon depuis Settings → API.'
  }

  if (isLegacyAnonKey(anonKey) && keyRef && urlRef !== keyRef) {
    return `Incohérence Supabase : l'URL pointe vers "${urlRef}" mais la clé anon correspond à "${keyRef}". Copiez les deux depuis Settings → API.`
  }

  return null
}
