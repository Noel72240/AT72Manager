import { getSupabaseClient } from '@/services/supabase/client'

function randomAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Gestion portail côté atelier (staff) */
export const portalInviteService = {
  async enablePortalAccess(clientId: string): Promise<{ accessCode: string }> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase non configuré')

    const accessCode = randomAccessCode()
    const { error } = await db
      .from('clients')
      .update({
        portal_enabled: true,
        portal_access_code: accessCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (error) throw error
    return { accessCode }
  },

  async disablePortalAccess(clientId: string): Promise<void> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase non configuré')

    const { error } = await db
      .from('clients')
      .update({
        portal_enabled: false,
        portal_access_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (error) throw error
  },

  async getPortalStatus(clientId: string): Promise<{
    enabled: boolean
    accessCode?: string
    hasAccount: boolean
  }> {
    const db = getSupabaseClient()
    if (!db) return { enabled: false, hasAccount: false }

    const [clientRes, accountRes] = await Promise.all([
      db
        .from('clients')
        .select('portal_enabled, portal_access_code')
        .eq('id', clientId)
        .maybeSingle(),
      db.from('client_accounts').select('id').eq('client_id', clientId).maybeSingle(),
    ])

    const row = clientRes.data as Record<string, unknown> | null
    return {
      enabled: Boolean(row?.portal_enabled),
      accessCode: (row?.portal_access_code as string | null) ?? undefined,
      hasAccount: Boolean(accountRes.data),
    }
  },

  async notifyClientOnMessage(params: {
    clientId: string
    workshopId: string
  }): Promise<void> {
    await this.notifyClient({
      clientId: params.clientId,
      workshopId: params.workshopId,
      kind: 'message_received',
      title: 'Nouveau message de l’atelier',
      body: 'Vous avez un message dans votre espace client.',
    })
  },

  async notifyClient(params: {
    clientId: string
    workshopId: string
    kind: string
    title: string
    body: string
    metadata?: Record<string, unknown>
  }): Promise<void> {
    const db = getSupabaseClient()
    if (!db) return
    await db.from('portal_notifications').insert({
      client_id: params.clientId,
      workshop_id: params.workshopId,
      kind: params.kind,
      title: params.title,
      body: params.body,
      metadata: (params.metadata ?? {}) as import('@/services/supabase/types').Json,
    })
  },
}
