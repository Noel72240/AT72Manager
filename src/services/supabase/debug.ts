import {
  getSupabaseRefFromAnonKey,
  getSupabaseRefFromUrl,
  isPublishableKey,
  normalizeSupabaseUrl,
  validateSupabaseEnv,
} from '@/config/supabase-env'

export { normalizeSupabaseUrl }

export type SupabaseDiagnostics = {
  url: string
  urlRef: string | null
  keyRef: string | null
  configError: string | null
  reachable: boolean
  authApiOk: boolean
  apiKeyValid: boolean
  message: string
}

export async function runSupabaseDiagnostics(
  url: string,
  anonKey: string,
  fetchFn: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<SupabaseDiagnostics> {
  const normalizedUrl = normalizeSupabaseUrl(url)
  const urlRef = getSupabaseRefFromUrl(normalizedUrl)
  const keyRef = getSupabaseRefFromAnonKey(anonKey) ?? (isPublishableKey(anonKey) ? 'publishable' : null)
  const configError = validateSupabaseEnv(normalizedUrl, anonKey)

  const result: SupabaseDiagnostics = {
    url: normalizedUrl,
    urlRef,
    keyRef,
    configError,
    reachable: false,
    authApiOk: false,
    apiKeyValid: false,
    message: 'Diagnostic en attente…',
  }

  if (configError) {
    result.message = configError
    return result
  }

  try {
    const healthResponse = await fetchFn(`${normalizedUrl}/auth/v1/health`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    })

    result.reachable = true
    result.authApiOk = healthResponse.status === 200 || healthResponse.status === 401

    const tokenResponse = await fetchFn(
      `${normalizedUrl}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'diagnostic@test.local', password: 'invalid' }),
      },
    )

    const tokenBody = (await tokenResponse.json().catch(() => ({}))) as {
      message?: string
      error_description?: string
    }

    if (tokenBody.message === 'Invalid API key') {
      result.apiKeyValid = false
      result.message =
        'Clé anon invalide pour ce projet. Copiez la clé depuis Supabase → Settings → API.'
      return result
    }

    result.apiKeyValid = true
    result.message =
      tokenResponse.status === 400 || tokenBody.error_description?.includes('Invalid')
        ? 'Supabase répond correctement (auth opérationnelle).'
        : `Supabase répond (HTTP ${tokenResponse.status}).`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    result.message =
      message.includes('error sending request') || message.includes('Failed to fetch')
        ? `Impossible de joindre ${normalizedUrl}. Vérifiez l'URL (ref: ${urlRef}) et votre connexion.`
        : message
  }

  return result
}

export function logSupabaseDiagnostics(diagnostics: SupabaseDiagnostics) {
  console.group('[supabase] Diagnostic')
  console.log('URL:', diagnostics.url)
  console.log('Ref URL:', diagnostics.urlRef)
  console.log('Ref clé:', diagnostics.keyRef)
  console.log('Config OK:', !diagnostics.configError)
  console.log('Reachable:', diagnostics.reachable)
  console.log('Auth API:', diagnostics.authApiOk)
  console.log('API key valid:', diagnostics.apiKeyValid)
  console.log('Message:', diagnostics.message)
  console.groupEnd()
}
