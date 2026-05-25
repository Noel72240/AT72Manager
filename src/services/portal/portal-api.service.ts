import { ensureSupabaseClient, getSupabaseClient } from '@/services/supabase/client'
import type { Client, Device, Intervention } from '@/types/entities'
import type {
  PortalInvoice,
  PortalMessage,
  PortalNotification,
  PortalQuote,
  PortalQuoteValidation,
  PortalRepairEvent,
} from '@/types/portal.types'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { normalizePaymentStatus } from '@/modules/interventions/utils/payment-labels'
import { interventionDocumentsService, AT72_DOCUMENTS_BUCKET, LEGACY_DOCUMENTS_BUCKET } from '@/services/interventions/intervention-documents.service'
import { parseLines } from '@/services/database/repositories/commercial-map'

function mapClient(row: Record<string, unknown>): Client {
  const name = (row.name as string) || ''
  const parts = name.trim().split(/\s+/)
  return {
    id: row.id as string,
    firstName: parts[0] || 'Client',
    lastName: parts.slice(1).join(' ') || '',
    email: (row.email as string | null) ?? undefined,
    phone: (row.phone as string | null) ?? undefined,
    address: (row.address as string | null) ?? undefined,
    status: (row.status as Client['status']) ?? 'active',
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function mapIntervention(row: Record<string, unknown>): Intervention {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    deviceId: (row.device_id as string | null) ?? undefined,
    deviceLabel: (row.device_label as string | null) ?? undefined,
    brand: (row.brand as string | null) ?? undefined,
    model: (row.model as string | null) ?? undefined,
    imeiOrSerial: (row.imei_or_serial as string | null) ?? undefined,
    reportedIssue: (row.reported_issue as string | null) || (row.title as string | null) || '',
    diagnostic: (row.diagnostic as string | null) ?? undefined,
    technicianNotes: (row.technician_notes as string | null) ?? undefined,
    status: (row.status as Intervention['status']) ?? 'diagnostic',
    scheduledAt: (row.scheduled_at as string | null) ?? undefined,
    completedAt: (row.completed_at as string | null) ?? undefined,
    priority: (row.priority as Intervention['priority']) ?? 'medium',
    durationMinutes: Number(row.duration_minutes) || 60,
    estimatedPrice: row.estimated_price != null ? Number(row.estimated_price) : undefined,
    finalPrice: row.final_price != null ? Number(row.final_price) : undefined,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : undefined,
    paymentStatus: normalizePaymentStatus(row.payment_status),
    billedViaQonto: Boolean(row.billed_via_qonto),
    externalInvoiceRef: (row.external_invoice_ref as string | null) ?? undefined,
    qontoDocumentUrl: (row.qonto_document_url as string | null) ?? undefined,
    media: normalizeInterventionMedia(row.media as Intervention['media']),
    partsLines: parseLines(row.parts_lines),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function mapQuote(row: Record<string, unknown>): PortalQuote {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: row.client_id as string,
    interventionId: (row.intervention_id as string | null) ?? undefined,
    deviceId: (row.device_id as string | null) ?? undefined,
    status: (row.status as PortalQuote['status']) ?? 'draft',
    title: (row.title as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    lines: parseLines(row.lines),
    subtotal: Number(row.subtotal) || 0,
    vatTotal: Number(row.vat_total) || 0,
    total: Number(row.total) || 0,
    validUntil: (row.valid_until as string | null) ?? undefined,
    convertedInvoiceId: (row.converted_invoice_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function mapInvoice(row: Record<string, unknown>): PortalInvoice {
  return {
    id: row.id as string,
    number: row.number as string,
    clientId: row.client_id as string,
    quoteId: (row.quote_id as string | null) ?? undefined,
    interventionId: (row.intervention_id as string | null) ?? undefined,
    status: (row.status as PortalInvoice['status']) ?? 'draft',
    title: (row.title as string | null) ?? undefined,
    notes: (row.notes as string | null) ?? undefined,
    lines: parseLines(row.lines),
    subtotal: Number(row.subtotal) || 0,
    vatTotal: Number(row.vat_total) || 0,
    total: Number(row.total) || 0,
    dueDate: (row.due_date as string | null) ?? undefined,
    paidAt: (row.paid_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

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

function mapNotification(row: Record<string, unknown>): PortalNotification {
  return {
    id: row.id as string,
    workshopId: row.workshop_id as string,
    clientId: row.client_id as string,
    kind: row.kind as PortalNotification['kind'],
    title: row.title as string,
    body: row.body as string,
    readAt: (row.read_at as string | null) ?? undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.created_at as string,
  }
}

function mapRepairEvent(row: Record<string, unknown>): PortalRepairEvent {
  return {
    id: row.id as string,
    interventionId: row.intervention_id as string,
    workshopId: row.workshop_id as string,
    clientId: row.client_id as string,
    stage: row.stage as PortalRepairEvent['stage'],
    label: row.label as string,
    note: (row.note as string | null) ?? undefined,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at as string,
  }
}

function mapValidation(row: Record<string, unknown>): PortalQuoteValidation {
  return {
    id: row.id as string,
    quoteId: row.quote_id as string,
    clientId: row.client_id as string,
    workshopId: row.workshop_id as string,
    status: row.status as PortalQuoteValidation['status'],
    signatureData: (row.signature_data as string | null) ?? undefined,
    clientNote: (row.client_note as string | null) ?? undefined,
    validatedAt: (row.validated_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export const portalApiService = {
  async fetchAll(clientId: string) {
    await ensureSupabaseClient()
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const [
      clientRes,
      interventionsRes,
      devicesRes,
      quotesRes,
      invoicesRes,
      messagesRes,
      notificationsRes,
    ] = await Promise.all([
      db.from('clients').select('*').eq('id', clientId).maybeSingle(),
      db.from('interventions').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }),
      db.from('devices').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }),
      db.from('quotes').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      db.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      db.from('portal_messages').select('*').eq('client_id', clientId).order('created_at', { ascending: true }),
      db.from('portal_notifications').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(50),
    ])

    if (clientRes.error) throw clientRes.error

    const interventionIds = (interventionsRes.data ?? []).map((r) => (r as Record<string, unknown>).id as string)
    let repairEvents: PortalRepairEvent[] = []
    if (interventionIds.length > 0) {
      const eventsRes = await db
        .from('portal_repair_events')
        .select('*')
        .in('intervention_id', interventionIds)
        .eq('is_public', true)
        .order('created_at', { ascending: true })
      repairEvents = (eventsRes.data ?? []).map((r) => mapRepairEvent(r as Record<string, unknown>))
    }

    const interventions = (interventionsRes.data ?? []).map((r) =>
      mapIntervention(r as Record<string, unknown>),
    )

    const portalDocuments = await interventionDocumentsService.listPortalDocuments(
      clientId,
      interventions,
    )

    return {
      client: clientRes.data ? mapClient(clientRes.data as Record<string, unknown>) : null,
      interventions,
      devices: (devicesRes.data ?? []).map((r) => {
        const row = r as Record<string, unknown>
        return {
          id: row.id as string,
          clientId: row.client_id as string,
          deviceType: (row.device_type as string) || 'Appareil',
          brand: (row.brand as string | null) ?? undefined,
          model: (row.model as string | null) ?? undefined,
          serialNumber: (row.serial_number as string | null) ?? undefined,
          imei: (row.imei as string | null) ?? undefined,
          condition: (row.condition as Device['condition']) ?? 'good',
          notes: (row.notes as string | null) ?? undefined,
          createdAt: row.created_at as string,
          updatedAt: row.updated_at as string,
          userId: row.user_id as string,
        } satisfies Device
      }),
      quotes: (quotesRes.data ?? []).map((r) => mapQuote(r as Record<string, unknown>)),
      invoices: (invoicesRes.data ?? []).map((r) => mapInvoice(r as Record<string, unknown>)),
      messages: (messagesRes.data ?? []).map((r) => mapMessage(r as Record<string, unknown>)),
      notifications: (notificationsRes.data ?? []).map((r) => mapNotification(r as Record<string, unknown>)),
      portalDocuments,
      repairEvents,
    }
  },

  async fetchRepairEvents(interventionId: string): Promise<PortalRepairEvent[]> {
    const db = getSupabaseClient()
    if (!db) return []
    const { data } = await db
      .from('portal_repair_events')
      .select('*')
      .eq('intervention_id', interventionId)
      .eq('is_public', true)
      .order('created_at', { ascending: true })
    return (data ?? []).map((r) => mapRepairEvent(r as Record<string, unknown>))
  },

  async sendMessage(params: {
    clientId: string
    workshopId: string
    body: string
    interventionId?: string
    senderName: string
  }): Promise<PortalMessage> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const { data, error } = await db
      .from('portal_messages')
      .insert({
        client_id: params.clientId,
        workshop_id: params.workshopId,
        intervention_id: params.interventionId ?? null,
        sender_type: 'client',
        sender_name: params.senderName,
        body: params.body.trim(),
      })
      .select()
      .single()

    if (error) throw error
    return mapMessage(data as Record<string, unknown>)
  },

  async markNotificationRead(id: string): Promise<void> {
    const db = getSupabaseClient()
    if (!db) return
    await db
      .from('portal_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
  },

  async fetchQuoteValidation(quoteId: string, clientId: string): Promise<PortalQuoteValidation | null> {
    const db = getSupabaseClient()
    if (!db) return null
    const { data } = await db
      .from('portal_quote_validations')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('client_id', clientId)
      .maybeSingle()
    return data ? mapValidation(data as Record<string, unknown>) : null
  },

  async validateQuote(params: {
    quoteId: string
    clientId: string
    workshopId: string
    status: 'accepted' | 'rejected'
    signatureData?: string
    clientNote?: string
  }): Promise<PortalQuoteValidation> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')

    const payload = {
      quote_id: params.quoteId,
      client_id: params.clientId,
      workshop_id: params.workshopId,
      status: params.status,
      signature_data: params.signatureData ?? null,
      client_note: params.clientNote ?? null,
      validated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await db
      .from('portal_quote_validations')
      .upsert(payload as never, { onConflict: 'quote_id,client_id' })
      .select()
      .single()

    if (error) throw error

    if (params.status === 'accepted') {
      await db.from('quotes').update({ status: 'accepted' }).eq('id', params.quoteId)
    } else {
      await db.from('quotes').update({ status: 'rejected' }).eq('id', params.quoteId)
    }

    return mapValidation(data as Record<string, unknown>)
  },

  async saveSignature(params: {
    clientId: string
    workshopId: string
    purpose: 'quote_acceptance' | 'repair_pickup' | 'general'
    signatureData: string
    interventionId?: string
    quoteId?: string
  }): Promise<void> {
    const db = getSupabaseClient()
    if (!db) throw new Error('Supabase indisponible')
    await db.from('portal_client_signatures').insert({
      client_id: params.clientId,
      workshop_id: params.workshopId,
      purpose: params.purpose,
      signature_data: params.signatureData,
      intervention_id: params.interventionId ?? null,
      quote_id: params.quoteId ?? null,
    })
  },

  async getClientDocumentDownloadUrl(storagePath: string): Promise<string | null> {
    const db = getSupabaseClient()
    if (!db) return null

    for (const bucket of [AT72_DOCUMENTS_BUCKET, LEGACY_DOCUMENTS_BUCKET]) {
      const { data, error } = await db.storage.from(bucket).createSignedUrl(storagePath, 3600)
      if (!error && data?.signedUrl) return data.signedUrl
    }
    return null
  },
}
