import type { BackupArchive, BackupPayload } from '@/services/backup/backup.types'

const EMPTY_SETTINGS: BackupPayload['settings'] = {
  documentSequences: {},
  customMeta: {},
}

/** Complète les sections absentes (sauvegardes antérieures à v1 planning). */
export function normalizeBackupPayload(data: Partial<BackupPayload>): BackupPayload {
  return {
    clients: data.clients ?? [],
    devices: data.devices ?? [],
    interventions: data.interventions ?? [],
    interventionPhotos: data.interventionPhotos ?? [],
    spareParts: data.spareParts ?? [],
    stockMovements: data.stockMovements ?? [],
    activityFeed: data.activityFeed ?? [],
    aiConversations: data.aiConversations ?? [],
    calendarLinks: data.calendarLinks ?? [],
    calendarQueue: data.calendarQueue ?? [],
    settings: data.settings ?? EMPTY_SETTINGS,
  }
}

export function normalizeBackupArchive(archive: BackupArchive): BackupArchive {
  return {
    ...archive,
    data: normalizeBackupPayload(archive.data),
  }
}
