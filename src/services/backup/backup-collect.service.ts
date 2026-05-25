import { getDb, getMeta } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { BackupEntityKey, BackupPayload, BackupSettingsPayload } from '@/services/backup/backup.types'

const META_SETTINGS_PREFIXES = ['doc_seq_', 'backup_settings', 'last_sync_at', 'activity_feed_remote_blocked']

function belongsToUser(item: { userId?: string }, userId: string): boolean {
  return !item.userId || item.userId === userId
}

async function readStore<T extends { userId?: string }>(
  storeName: string,
  userId: string,
): Promise<T[]> {
  const db = await getDb()
  const all = (await db.getAll(storeName as never)) as T[]
  return all.filter((row) => belongsToUser(row, userId))
}

async function collectSettingsMeta(): Promise<BackupSettingsPayload> {
  const db = await getDb()
  const keys = await db.getAllKeys(STORES.meta)
  const documentSequences: Record<string, number> = {}
  const customMeta: Record<string, unknown> = {}

  for (const key of keys) {
    const keyStr = String(key)
    if (keyStr.startsWith('doc_seq_')) {
      const val = await getMeta<number>(keyStr)
      if (typeof val === 'number') documentSequences[keyStr] = val
    } else if (keyStr === 'backup_settings' || keyStr === 'last_sync_at') {
      customMeta[keyStr] = await getMeta(keyStr)
    } else if (META_SETTINGS_PREFIXES.some((p) => keyStr.startsWith(p))) {
      customMeta[keyStr] = await getMeta(keyStr)
    }
  }

  return {
    documentSequences,
    customMeta,
    lastSyncAt: (customMeta.last_sync_at as string | undefined) ?? undefined,
    backupSettings: customMeta.backup_settings,
  }
}

export async function collectBackupPayload(userId: string): Promise<BackupPayload> {
  const [
    clients,
    devices,
    interventions,
    interventionPhotos,
    spareParts,
    stockMovements,
    activityFeed,
    aiConversations,
    calendarLinks,
    calendarQueue,
    settings,
  ] = await Promise.all([
    readStore(STORES.clients, userId),
    readStore(STORES.devices, userId),
    readStore(STORES.interventions, userId),
    readStore(STORES.interventionPhotos, userId),
    readStore(STORES.spareParts, userId),
    readStore(STORES.stockMovements, userId),
    readStore(STORES.activityFeed, userId),
    readStore(STORES.aiConversations, userId),
    readStore(STORES.calendarSyncLinks, userId),
    readStore(STORES.googleCalendarQueue, userId),
    collectSettingsMeta(),
  ])

  return {
    clients,
    devices,
    interventions,
    interventionPhotos,
    spareParts,
    stockMovements,
    activityFeed,
    aiConversations,
    calendarLinks,
    calendarQueue,
    settings,
  }
}

export function countBackupEntities(data: BackupPayload): Partial<Record<BackupEntityKey, number>> {
  return {
    clients: data.clients.length,
    devices: data.devices.length,
    interventions: data.interventions.length,
    interventionPhotos: data.interventionPhotos.length,
    spareParts: data.spareParts.length,
    stockMovements: data.stockMovements.length,
    activityFeed: data.activityFeed.length,
    aiConversations: data.aiConversations.length,
    calendarLinks: data.calendarLinks?.length ?? 0,
    calendarQueue: data.calendarQueue?.length ?? 0,
    settings: Object.keys(data.settings.documentSequences ?? {}).length + Object.keys(data.settings.customMeta ?? {}).length,
  }
}

export function pickBackupEntities(
  data: BackupPayload,
  entities: BackupEntityKey[],
): Partial<BackupPayload> {
  const picked: Partial<BackupPayload> = {}
  for (const key of entities) {
    picked[key] = data[key] as never
  }
  return picked
}

export function mergePartialPayload(base: BackupPayload, partial: Partial<BackupPayload>): BackupPayload {
  return {
    ...base,
    ...partial,
    settings: partial.settings ?? base.settings,
  }
}
