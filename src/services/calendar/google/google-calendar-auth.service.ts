import { isTauri } from '@tauri-apps/api/core'
import { invoke } from '@tauri-apps/api/core'
import { getMeta, setMeta } from '@/services/indexeddb/db'
import { env } from '@/config/env'
import {
  GOOGLE_CALENDAR_SCOPES,
  META_GOOGLE_TOKENS,
  type GoogleOAuthTokens,
} from '@/services/calendar/google/google-calendar.types'
import { createPkcePair, exchangeGoogleAuthCode } from '@/services/calendar/google/google-oauth-pkce'

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client'
const OAUTH_TIMEOUT_MS = 120_000

let gisLoadPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google Identity Services indisponible')))
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossible de charger Google Identity Services'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

async function connectViaTauriLoopback(): Promise<GoogleOAuthTokens> {
  const { codeVerifier, codeChallenge } = await createPkcePair()

  const result = await invoke<{ code: string; redirect_uri: string }>('google_oauth_loopback', {
    client_id: env.googleClientId,
    scope: GOOGLE_CALENDAR_SCOPES,
    code_challenge: codeChallenge,
  })

  const tokenResponse = await exchangeGoogleAuthCode(
    result.code,
    codeVerifier,
    result.redirect_uri,
    env.googleClientId,
  )

  return {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + (tokenResponse.expires_in ?? 3600) * 1000,
    scope: tokenResponse.scope,
    tokenType: tokenResponse.token_type,
  }
}

async function connectViaBrowserPopup(): Promise<GoogleOAuthTokens> {
  await loadGoogleScript()

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      fn()
    }

    const timeoutId = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            'Connexion Google expirée. Autorisez les popups dans votre navigateur ou utilisez l’app desktop.',
          ),
        ),
      )
    }, OAUTH_TIMEOUT_MS)

    const client = window.google!.accounts!.oauth2!.initTokenClient({
      client_id: env.googleClientId,
      scope: GOOGLE_CALENDAR_SCOPES,
      callback: (response) => {
        if (response.error) {
          finish(() => reject(new Error(response.error_description ?? response.error)))
          return
        }
        if (!response.access_token) {
          finish(() => reject(new Error('Token Google invalide')))
          return
        }

        const tokens: GoogleOAuthTokens = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
          scope: response.scope,
          tokenType: response.token_type,
        }
        void setMeta(META_GOOGLE_TOKENS, tokens).then(() => finish(() => resolve(tokens)))
      },
      error_callback: (error) => {
        const message = error.message ?? 'Connexion Google annulée ou refusée'
        finish(() =>
          reject(
            new Error(
              message.includes('popup')
                ? 'Popup Google bloquée. Autorisez les popups ou lancez AT72Manager via Tauri (npm run dev:tauri).'
                : message,
            ),
          ),
        )
      },
    })

    client.requestAccessToken({ prompt: '' })
  })
}

export const googleCalendarAuthService = {
  isConfigured(): boolean {
    return env.isGoogleCalendarConfigured
  },

  isDesktopApp(): boolean {
    return isTauri()
  },

  async getStoredTokens(): Promise<GoogleOAuthTokens | null> {
    return (await getMeta<GoogleOAuthTokens>(META_GOOGLE_TOKENS)) ?? null
  },

  async saveTokens(tokens: GoogleOAuthTokens): Promise<void> {
    await setMeta(META_GOOGLE_TOKENS, tokens)
  },

  async clearTokens(): Promise<void> {
    const tokens = await this.getStoredTokens()
    if (tokens?.accessToken && window.google?.accounts?.oauth2?.revoke) {
      await new Promise<void>((resolve) => {
        window.google!.accounts!.oauth2!.revoke(tokens.accessToken, () => resolve())
      })
    }
    await setMeta(META_GOOGLE_TOKENS, null)
  },

  async getValidAccessToken(): Promise<string | null> {
    const tokens = await this.getStoredTokens()
    if (!tokens?.accessToken) return null
    if (Date.now() < tokens.expiresAt - 60_000) return tokens.accessToken
    return null
  },

  async connect(): Promise<GoogleOAuthTokens> {
    if (!env.googleClientId) {
      throw new Error(
        'Google Calendar non configuré. Ajoutez VITE_GOOGLE_CLIENT_ID dans .env (Console Google Cloud).',
      )
    }

    let tokens: GoogleOAuthTokens

    if (isTauri()) {
      tokens = await connectViaTauriLoopback()
    } else {
      tokens = await connectViaBrowserPopup()
    }

    await this.saveTokens(tokens)
    return tokens
  },

  async ensureAccessToken(): Promise<string> {
    const cached = await this.getValidAccessToken()
    if (cached) return cached

    const tokens = await this.connect()
    return tokens.accessToken
  },
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: {
              access_token?: string
              expires_in?: number
              scope?: string
              token_type?: string
              error?: string
              error_description?: string
            }) => void
            error_callback?: (error: { type?: string; message?: string }) => void
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void }
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}
