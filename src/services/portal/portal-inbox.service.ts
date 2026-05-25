import { getSupabaseClient } from '@/services/supabase/client'
import type { PortalMessage } from '@/types/portal.types'

function mapMessage(row: Record<string, unknown>): PortalMessage {
  return {
    id: row.id as string,
    workshopId: row.workshop_id as string,
    clientId: row.client_id as string,
    interventionId: (row.intervention_id as string | null) ?? undefined,
    senderType: row.sender_type as PortalMessage['senderType'],
    senderName: (row.sender_name as string | null) ?? undefined,
    body: row.body as string,
    readAt: (row.read_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
  }
}

export const portalInboxService = {
  async listForWorkshop(workshopId: string): Promise<PortalMessage[]> {
    const db = getSupabaseClient()
    if (!db) return []

    const { data, error } = await db
      .from('portal_messages')
      .select('*')
      .eq('workshop_id', workshopId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapMessage(r as Record<string, unknown>))
  },

  async sendFromWorkshop(params: {
    workshopId: string
    clientId: string
    body: string
    senderName: string
    interventionId?: string
  }): Promise<PortalMessage> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const { data, error } = await db
      .from('portal_messages')
      .insert({
        workshop_id: params.workshopId,
        client_id: params.clientId,
        intervention_id: params.interventionId ?? null,
        sender_type: 'workshop',
        sender_name: params.senderName,
        body: params.body.trim(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return mapMessage(data as Record<string, unknown>)
  },

  async markClientMessagesRead(clientId: string, workshopId: string): Promise<void> {
    const db = getSupabaseClient()
    if (!db) return

    await db
      .from('portal_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .eq('workshop_id', workshopId)
      .eq('sender_type', 'client')
      .is('read_at', null)
  },
}
