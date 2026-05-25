function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomVerifier(length = 64): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export async function createPkcePair(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const codeVerifier = randomVerifier(64)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  const codeChallenge = base64UrlEncode(new Uint8Array(digest))
  return { codeVerifier, codeChallenge }
}

export async function exchangeGoogleAuthCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
): Promise<{
  access_token: string
  expires_in?: number
  scope?: string
  token_type?: string
  refresh_token?: string
}> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  })

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const payload = (await response.json()) as {
    access_token?: string
    expires_in?: number
    scope?: string
    token_type?: string
    refresh_token?: string
    error?: string
    error_description?: string
  }

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? 'Échange token Google échoué')
  }

  return {
    access_token: payload.access_token,
    expires_in: payload.expires_in,
    scope: payload.scope,
    token_type: payload.token_type,
    refresh_token: payload.refresh_token,
  }
}
