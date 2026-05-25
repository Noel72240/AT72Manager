import type {
  ActivityFeedItem,
  Client,
  Device,
  Intervention,
  SparePart,
  StockMovement,
} from '@/types/entities'
import { env } from '@/config/env'
import { joinClientName } from '@/modules/clients/utils/client-name'
import { serializeLines } from '@/services/database/repositories/commercial-map'
import { databaseService } from '@/services/database/database.service'
import type { TableName } from '@/services/supabase/types'
import type { BackupEntityKey, BackupPayload } from '@/services/backup/backup.types'
import type { BackupLogger } from '@/services/backup/backup-logger.service'
import { syncQueue } from '@/services/sync/sync-queue'

const SYNC_ENTITY_ORDER: BackupEntityKey[] = [
  'clients',
  'devices',
  'interventions',
  'spareParts',
  'stockMovements',
  'activityFeed',
  'aiConversations',
]

async function upsertRemoteRow(table: TableName, row: Record<string, unknown>): Promise<void> {
  const id = String(row.id ?? '')
  if (!id) return

  const { id: _ignored, ...patch } = row
  try {
    await databaseService.update(table, id, patch)
  } catch {
    await databaseService.insert(table, row)
  }
}

function clientRow(client: Client): Record<string, unknown> {
  return {
    id: client.id,
    name: joinClientName(client.firstName, client.lastName),
    email: client.email ?? null,
    phone: client.phone ?? null,
    address: client.address ?? null,
    status: client.status,
    notes: client.notes ?? null,
    user_id: client.userId,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  }
}

function deviceRow(device: Device): Record<string, unknown> {
  return {
    id: device.id,
    client_id: device.clientId,
    device_type: device.deviceType,
    brand: device.brand ?? null,
    model: device.model ?? null,
    serial_number: device.serialNumber ?? null,
    imei: device.imei ?? null,
    storage_capacity: device.storageCapacity ?? null,
    color: device.color ?? null,
    condition: device.condition,
    notes: device.notes ?? null,
    media: device.media ?? {},
    user_id: device.userId,
    created_at: device.createdAt,
    updated_at: device.updatedAt,
  }
}

function interventionRow(intervention: Intervention): Record<string, unknown> {
  return {
    id: intervention.id,
    client_id: intervention.clientId,
    device_id: intervention.deviceId ?? null,
    device_label: intervention.deviceLabel ?? null,
    brand: intervention.brand ?? null,
    model: intervention.model ?? null,
    imei_or_serial: intervention.imeiOrSerial ?? null,
    reported_issue: intervention.reportedIssue,
    diagnostic: intervention.diagnostic ?? null,
    technician_notes: intervention.technicianNotes ?? null,
    status: intervention.status,
    scheduled_at: intervention.scheduledAt ?? null,
    completed_at: intervention.completedAt ?? null,
    priority: intervention.priority ?? 'medium',
    duration_minutes: intervention.durationMinutes ?? 60,
    assigned_technician_id: intervention.assignedTechnicianId ?? null,
    estimated_price: intervention.estimatedPrice ?? null,
    final_price: intervention.finalPrice ?? null,
    deposit_amount: intervention.depositAmount ?? null,
    payment_status: intervention.paymentStatus ?? 'none',
    billed_via_qonto: intervention.billedViaQonto ?? false,
    external_invoice_ref: intervention.externalInvoiceRef ?? null,
    qonto_document_url: intervention.qontoDocumentUrl ?? null,
    media: intervention.media ?? {},
    parts_lines: serializeLines(intervention.partsLines ?? []),
    title: intervention.reportedIssue,
    description: intervention.technicianNotes ?? null,
    user_id: intervention.userId,
    created_at: intervention.createdAt,
    updated_at: intervention.updatedAt,
  }
}

function sparePartRow(part: SparePart): Record<string, unknown> {
  return {
    id: part.id,
    name: part.name,
    category: part.category,
    reference: part.reference,
    supplier: part.supplier ?? null,
    purchase_price: part.purchasePrice,
    sale_price: part.salePrice,
    quantity: part.quantity,
    min_threshold: part.minThreshold,
    notes: part.notes ?? null,
    user_id: part.userId,
    created_at: part.createdAt,
    updated_at: part.updatedAt,
  }
}

function stockMovementRow(movement: StockMovement): Record<string, unknown> {
  return {
    id: movement.id,
    part_id: movement.partId,
    movement_type: movement.movementType,
    delta: movement.delta,
    quantity_after: movement.quantityAfter,
    reference_type: movement.referenceType ?? null,
    reference_id: movement.referenceId ?? null,
    notes: movement.notes ?? null,
    user_id: movement.userId,
    created_at: movement.createdAt,
  }
}

function activityFeedRow(item: ActivityFeedItem): Record<string, unknown> {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    message: item.message ?? null,
    severity: item.severity,
    href: item.href ?? null,
    entity_type: item.entityType ?? null,
    entity_id: item.entityId ?? null,
    dedupe_key: item.dedupeKey ?? null,
    read: item.read,
    archived: item.archived,
    user_id: item.userId,
    created_at: item.createdAt,
  }
}

async function pushEntityRows(entity: BackupEntityKey, data: BackupPayload): Promise<number> {
  switch (entity) {
    case 'clients': {
      const rows = (data.clients as Client[]).map(clientRow)
      for (const row of rows) await upsertRemoteRow('clients', row)
      return rows.length
    }
    case 'devices': {
      const rows = (data.devices as Device[]).map(deviceRow)
      for (const row of rows) await upsertRemoteRow('devices', row)
      return rows.length
    }
    case 'interventions': {
      const rows = (data.interventions as Intervention[]).map(interventionRow)
      for (const row of rows) await upsertRemoteRow('interventions', row)
      return rows.length
    }
    case 'spareParts': {
      const rows = (data.spareParts as SparePart[]).map(sparePartRow)
      for (const row of rows) await upsertRemoteRow('spare_parts', row)
      return rows.length
    }
    case 'stockMovements': {
      const rows = (data.stockMovements as StockMovement[]).map(stockMovementRow)
      for (const row of rows) await upsertRemoteRow('stock_movements', row)
      return rows.length
    }
    case 'activityFeed': {
      const rows = (data.activityFeed as ActivityFeedItem[]).map(activityFeedRow)
      for (const row of rows) await upsertRemoteRow('activity_feed', row)
      return rows.length
    }
    case 'aiConversations': {
      const rows = data.aiConversations as Array<Record<string, unknown>>
      for (const row of rows) {
        if (row.id) await upsertRemoteRow('ai_conversations', row)
      }
      return rows.length
    }
    default:
      return 0
  }
}

/** Réinjecte les données restaurées dans Supabase et purge la file sync (évite re-suppression). */
export async function reconcileRestoredDataWithSupabase(
  data: BackupPayload,
  restoredEntities: BackupEntityKey[],
  logger: BackupLogger,
): Promise<void> {
  if (!env.isSupabaseConfigured || !navigator.onLine || !databaseService.isAvailable()) {
    logger.warn('cloud_reconcile_skipped', 'Hors ligne ou Supabase indisponible — données locales uniquement')
    return
  }

  await syncQueue.clearAll()
  logger.info('sync_queue_cleared', 'File de synchronisation vidée après restauration')

  const ordered = SYNC_ENTITY_ORDER.filter((entity) => restoredEntities.includes(entity))
  let total = 0

  for (const entity of ordered) {
    try {
      const count = await pushEntityRows(entity, data)
      total += count
      if (count > 0) {
        logger.success('cloud_entity_pushed', `${entity}: ${count} enregistrement(s) envoyé(s) à Supabase`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn('cloud_entity_push_failed', `${entity}: ${message}`)
    }
  }

  logger.success('cloud_reconcile_done', `${total} enregistrement(s) réconcilié(s) avec Supabase`)
}
