import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { env } from '@/config/env'
import type { AppUser, SignInCredentials } from '@/types/user.types'
import { getSupabaseClient, ensureSupabaseClient } from '@/services/supabase/client'
import { withTimeout } from '@/utils/async'
import { resolveAppUser } from '@/services/auth/profile.service'
import { securityLogService } from '@/services/audit/security-log.service'
import { auditService } from '@/services/audit/audit.service'

const SESSION_TIMEOUT_MS = 8000

export class AuthError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

type AuthSessionCallback = (session: Session | null, user?: AppUser | null) => void

async function mapSessionUser(session: Session): Promise<AppUser> {
  return resolveAppUser(session.user)
}

export const authService = {
  isConfigured(): boolean {
    return env.isSupabaseConfigured
  },

  async getSession(): Promise<Session | null> {
    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await withTimeout(
      client.auth.getSession(),
      SESSION_TIMEOUT_MS,
      'Supabase session timeout',
    )
    if (error) throw new AuthError(error.message, error.code)

    return data.session
  },

  async signIn({ email, password }: SignInCredentials): Promise<{
    session: Session
    user: AppUser
  }> {
    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) {
      throw new AuthError(
        'Supabase non configuré. Copiez .env.example vers .env et renseignez vos clés.',
      )
    }

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      await securityLogService.log({
        eventType: 'login_failed',
        severity: 'warning',
        message: `Échec connexion : ${email.trim()}`,
        metadata: { email: email.trim() },
      })

      const isNetworkError =
        error.message === 'Failed to fetch' ||
        error.message.includes('NetworkError') ||
        error.message.includes('error sending request')

      throw new AuthError(
        isNetworkError
          ? 'Impossible de joindre Supabase. Vérifiez l’URL et la clé anon dans .env (Settings → API).'
          : error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect.'
            : error.message,
        error.code,
      )
    }

    if (!data.session || !data.user) {
      throw new AuthError('Session invalide après connexion.')
    }

    const user = await mapSessionUser(data.session)

    await securityLogService.log({
      eventType: 'login_success',
      severity: 'info',
      message: `Connexion réussie — ${user.fullName}`,
      userId: user.id,
      workshopId: user.workshopId,
    })

    if (user.workshopId) {
      await auditService.log({
        workshopId: user.workshopId,
        actorId: user.id,
        actorName: user.fullName,
        action: 'login',
        resource: 'session',
        summary: `Connexion depuis ${email.trim()}`,
      })
    }

    return {
      session: data.session,
      user,
    }
  },

  async signOut(user?: AppUser | null): Promise<void> {
    if (user?.workshopId) {
      await auditService.log({
        workshopId: user.workshopId,
        actorId: user.id,
        actorName: user.fullName,
        action: 'logout',
        resource: 'session',
        summary: 'Déconnexion',
      })
      await securityLogService.log({
        eventType: 'logout',
        severity: 'info',
        message: `Déconnexion — ${user.fullName}`,
        userId: user.id,
        workshopId: user.workshopId,
      })
    }

    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) return

    const { error } = await client.auth.signOut()
    if (error) throw new AuthError(error.message, error.code)
  },

  onAuthStateChange(callback: AuthSessionCallback): () => void {
    const client = getSupabaseClient()
    if (!client) return () => {}

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event: AuthChangeEvent, session) => {
      if (!session) {
        callback(null, null)
        return
      }
      try {
        const user = await mapSessionUser(session)
        callback(session, user)
      } catch (error) {
        console.warn('[auth] résolution profil:', error)
        callback(session, null)
      }
    })

    return () => subscription.unsubscribe()
  },

  async initialize(callback: AuthSessionCallback): Promise<() => void> {
    if (!env.isSupabaseConfigured) {
      callback(null, null)
      return () => {}
    }

    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) {
      callback(null, null)
      return () => {}
    }

    let session: Session | null = null

    try {
      session = await this.getSession()
    } catch (error) {
      console.warn('[auth] Impossible de restaurer la session Supabase:', error)
      session = null
    }

    if (session) {
      try {
        const user = await mapSessionUser(session)
        callback(session, user)
      } catch {
        callback(session, null)
      }
    } else {
      callback(null, null)
    }

    return this.onAuthStateChange(callback)
  },

  async resolveUser(user: User): Promise<AppUser> {
    return resolveAppUser(user)
  },
}

/** @deprecated Utiliser resolveAppUser via authService */
export { mapSupabaseUserBase as mapSupabaseUser } from '@/services/auth/profile.service'
