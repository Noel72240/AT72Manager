import type { Session, User } from '@supabase/supabase-js'
import { env } from '@/config/env'
import { ensureSupabaseClient, getSupabaseClient } from '@/services/supabase/client'
import type { ClientAccount, PortalClientSession } from '@/types/portal.types'
import { withTimeout } from '@/utils/async'
import { getClientFullName } from '@/modules/clients/utils/client-name'

const SESSION_TIMEOUT_MS = 10_000

export class PortalAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PortalAuthError'
  }
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'Email ou mot de passe incorrect. Vérifiez aussi que vous avez confirmé votre email (lien Supabase).'
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirmez votre email (lien reçu par mail), puis reconnectez-vous.'
  }
  if (lower.includes('user already registered')) {
    return 'Un compte existe déjà avec cet email. Utilisez « Se connecter ».'
  }
  return message
}

function mapClientAccount(row: Record<string, unknown>): ClientAccount {
  return {
    id: row.id as string,
    authUserId: row.auth_user_id as string,
    clientId: row.client_id as string,
    workshopId: row.workshop_id as string,
    enabled: Boolean(row.enabled),
    invitedAt: row.invited_at as string,
    lastLoginAt: (row.last_login_at as string | null) ?? undefined,
  }
}

async function fetchClientAccount(authUserId: string): Promise<ClientAccount | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client
    .from('client_accounts')
    .select('*')
    .eq('auth_user_id', authUserId)
    .eq('enabled', true)
    .maybeSingle()

  if (error) throw new PortalAuthError(error.message)
  if (!data) return null
  return mapClientAccount(data as Record<string, unknown>)
}

async function lookupClientByPortalCode(
  code: string,
): Promise<{ clientId: string; workshopId: string } | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.rpc('lookup_client_by_portal_code', {
    p_code: code.trim().toUpperCase(),
  })

  if (error) {
    console.warn('[portal-auth] lookup RPC:', error.message)
    return lookupClientByPortalCodeDirect(code)
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null

  const record = row as Record<string, unknown>
  const clientId = record.client_id as string | undefined
  const workshopId = record.workshop_id as string | undefined
  if (!clientId || !workshopId) return null

  return { clientId, workshopId }
}

/** Fallback si RPC pas encore migrée */
async function lookupClientByPortalCodeDirect(
  code: string,
): Promise<{ clientId: string; workshopId: string } | null> {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client
    .from('clients')
    .select('id, workshop_id')
    .eq('portal_access_code', code.trim().toUpperCase())
    .eq('portal_enabled', true)
    .maybeSingle()

  if (error || !data) return null
  const row = data as Record<string, unknown>
  return {
    clientId: row.id as string,
    workshopId: row.workshop_id as string,
  }
}

async function linkPortalAccount(
  userId: string,
  clientId: string,
  workshopId: string,
  accessCode: string,
): Promise<boolean> {
  const client = getSupabaseClient()
  if (!client) return false

  const { data, error } = await client.rpc('link_portal_client_account', {
    p_user_id: userId,
    p_client_id: clientId,
    p_workshop_id: workshopId,
    p_access_code: accessCode.trim().toUpperCase(),
  })

  if (error) {
    console.warn('[portal-auth] link RPC:', error.message)
    const { error: insertError } = await client.from('client_accounts').insert({
      auth_user_id: userId,
      client_id: clientId,
      workshop_id: workshopId,
      enabled: true,
    })
    return !insertError || insertError.message.includes('duplicate')
  }

  return Boolean(data)
}

async function tryRepairClientLink(user: User, accessCode?: string): Promise<boolean> {
  const meta = user.user_metadata ?? {}
  const clientId = typeof meta.client_id === 'string' ? meta.client_id : null
  const workshopId =
    typeof meta.workshop_id === 'string' ? meta.workshop_id : null

  if (!clientId) return false

  const client = getSupabaseClient()
  if (!client) return false

  let resolvedWorkshopId = workshopId

  if (!resolvedWorkshopId) {
    const { data } = await client.from('clients').select('workshop_id').eq('id', clientId).maybeSingle()
    resolvedWorkshopId = (data as { workshop_id?: string } | null)?.workshop_id ?? null
  }

  if (!resolvedWorkshopId) return false

  if (accessCode) {
    return linkPortalAccount(user.id, clientId, resolvedWorkshopId, accessCode)
  }

  const { error } = await client.from('client_accounts').insert({
    auth_user_id: user.id,
    client_id: clientId,
    workshop_id: resolvedWorkshopId,
    enabled: true,
  })

  return !error || error.message.includes('duplicate')
}

async function fetchClientProfile(clientId: string) {
  const client = getSupabaseClient()
  if (!client) return null

  const { data, error } = await client.from('clients').select('*').eq('id', clientId).maybeSingle()
  if (error) throw new PortalAuthError(error.message)
  if (!data) return null

  const row = data as Record<string, unknown>
  const name = (row.name as string) || ''
  const parts = name.trim().split(/\s+/)
  const firstName = parts[0] || 'Client'
  const lastName = parts.slice(1).join(' ') || ''

  return {
    id: row.id as string,
    firstName,
    lastName,
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
  }
}

export const portalAuthService = {
  isConfigured(): boolean {
    return env.isSupabaseConfigured
  },

  async signIn(email: string, password: string): Promise<PortalClientSession> {
    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) throw new PortalAuthError('Supabase non configuré.')

    const { data, error } = await withTimeout(
      client.auth.signInWithPassword({ email: email.trim(), password }),
      SESSION_TIMEOUT_MS,
      'Connexion portail',
    )

    if (error) throw new PortalAuthError(mapAuthError(error.message))
    if (!data.session?.user) throw new PortalAuthError('Session invalide.')

    try {
      return await this.resolveSession(data.session)
    } catch (err) {
      if (
        err instanceof PortalAuthError &&
        err.message.includes('pas autorisé') &&
        data.user
      ) {
        const repaired = await tryRepairClientLink(data.user)
        if (repaired) {
          return await this.resolveSession(data.session)
        }
      }
      throw err
    }
  },

  async signUp(params: {
    email: string
    password: string
    accessCode: string
  }): Promise<PortalClientSession> {
    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) throw new PortalAuthError('Supabase non configuré.')

    const code = params.accessCode.trim().toUpperCase()
    const lookup = await lookupClientByPortalCode(code)

    if (!lookup) {
      throw new PortalAuthError(
        'Code d’accès invalide ou portail non activé. Demandez un nouveau code à l’atelier.',
      )
    }

    const { clientId, workshopId } = lookup

    const { data: signUpData, error: signUpError } = await client.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: {
          account_type: 'client_portal',
          client_id: clientId,
          workshop_id: workshopId,
        },
      },
    })

    if (signUpError) throw new PortalAuthError(mapAuthError(signUpError.message))
    if (!signUpData.user) throw new PortalAuthError('Création de compte impossible.')

    const linked = await linkPortalAccount(signUpData.user.id, clientId, workshopId, code)

    if (!linked) {
      throw new PortalAuthError(
        'Compte créé mais liaison atelier impossible. Exécutez la migration 014_portal_auth_register_fix.sql dans Supabase.',
      )
    }

    if (!signUpData.session) {
      throw new PortalAuthError(
        'Compte créé avec succès. Ouvrez le lien de confirmation dans votre email (vérifiez les spams), puis connectez-vous avec le même mot de passe.',
      )
    }

    return this.resolveSession(signUpData.session)
  },

  async signOut(): Promise<void> {
    const client = getSupabaseClient()
    if (!client) return
    await client.auth.signOut()
  },

  async getSession(): Promise<Session | null> {
    await ensureSupabaseClient()
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await withTimeout(
      client.auth.getSession(),
      SESSION_TIMEOUT_MS,
      'Session portail',
    )
    if (error) return null
    return data.session
  },

  async resolveSession(session: Session): Promise<PortalClientSession> {
    let account = await fetchClientAccount(session.user.id)

    if (!account) {
      const repaired = await tryRepairClientLink(session.user)
      if (repaired) {
        account = await fetchClientAccount(session.user.id)
      }
    }

    if (!account) {
      throw new PortalAuthError(
        'Ce compte n’est pas lié au portail client. Réinscrivez-vous avec le code atelier ou contactez l’atelier.',
      )
    }

    const profile = await fetchClientProfile(account.clientId)
    const fullName = profile
      ? getClientFullName({ firstName: profile.firstName, lastName: profile.lastName })
      : session.user.email?.split('@')[0] || 'Client'

    const supabase = getSupabaseClient()
    if (supabase) {
      void supabase
        .from('client_accounts')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', account.id)
    }

    return {
      authUserId: session.user.id,
      clientId: account.clientId,
      workshopId: account.workshopId,
      email: session.user.email ?? '',
      fullName,
    }
  },

  async initialize(): Promise<PortalClientSession | null> {
    const session = await this.getSession()
    if (!session) return null
    try {
      return await this.resolveSession(session)
    } catch {
      return null
    }
  },
}
