import { create } from 'zustand'
import type {
  BackupEntityKey,
  BackupFormat,
  BackupSettings,
  BackupSnapshotRecord,
} from '@/services/backup/backup.types'
import {
  deleteBackupSnapshot,
  downloadBackupExport,
  getBackupSettings,
  listBackupSnapshots,
  parseBackupFile,
  restoreBackupArchive,
  rollbackToSnapshot,
  saveBackupSettings,
  verifyBackupArchive,
} from '@/services/backup'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { toast } from '@/store/toast.store'
import { ROUTES } from '@/config/routes'

type BackupStore = {
  snapshots: BackupSnapshotRecord[]
  settings: BackupSettings | null
  loading: boolean
  exporting: boolean
  restoring: boolean
  lastError: string | null
  load: (userId: string) => Promise<void>
  refreshSnapshots: (userId: string) => Promise<void>
  updateSettings: (settings: BackupSettings) => Promise<void>
  createManualBackup: (userId: string, format: BackupFormat, label?: string) => Promise<void>
  exportJson: (userId: string) => Promise<void>
  exportZip: (userId: string) => Promise<void>
  importFile: (userId: string, file: File, entities?: BackupEntityKey[]) => Promise<void>
  rollback: (userId: string, snapshotId: string) => Promise<void>
  removeSnapshot: (userId: string, snapshotId: string) => Promise<void>
  runAutoBackupIfDue: (userId: string) => Promise<void>
}

export const useBackupStore = create<BackupStore>((set, get) => ({
  snapshots: [],
  settings: null,
  loading: false,
  exporting: false,
  restoring: false,
  lastError: null,

  load: async (userId) => {
    set({ loading: true, lastError: null })
    try {
      const [settings, snapshots] = await Promise.all([
        getBackupSettings(),
        listBackupSnapshots(userId),
      ])
      set({ settings, snapshots, loading: false })
    } catch (error) {
      set({
        loading: false,
        lastError: error instanceof Error ? error.message : 'Erreur chargement sauvegardes',
      })
    }
  },

  refreshSnapshots: async (userId) => {
    const snapshots = await listBackupSnapshots(userId)
    set({ snapshots })
  },

  updateSettings: async (settings) => {
    await saveBackupSettings(settings)
    set({ settings })
    toast.success('Paramètres sauvegarde enregistrés')
  },

  createManualBackup: async (userId, format, label) => {
    set({ exporting: true, lastError: null })
    try {
      const snapshot = await downloadBackupExport({
        userId,
        format: format === 'full' ? 'zip' : format,
        label,
        source: 'manual',
      })
      await get().refreshSnapshots(userId)
      await emitFeedItem(
        userId,
        {
          kind: 'backup_success',
          title: 'Sauvegarde créée',
          message: snapshot?.label ?? 'Export téléchargé avec succès',
          href: ROUTES.SETTINGS,
          dedupeKey: `backup:${snapshot?.id ?? Date.now()}`,
        },
        { toast: true, toastVariant: 'success' },
      )
      toast.success('Sauvegarde terminée', 'Fichier téléchargé et snapshot local enregistré.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec export'
      set({ lastError: message })
      await emitFeedItem(
        userId,
        {
          kind: 'backup_failed',
          title: 'Échec sauvegarde',
          message,
          href: ROUTES.SETTINGS,
          severity: 'danger',
        },
        { toast: true, toastVariant: 'error' },
      )
    } finally {
      set({ exporting: false })
    }
  },

  exportJson: async (userId) => get().createManualBackup(userId, 'json'),
  exportZip: async (userId) => get().createManualBackup(userId, 'zip'),

  importFile: async (userId, file, entities) => {
    set({ restoring: true, lastError: null })
    try {
      const archive = await parseBackupFile(file)
      const integrity = await verifyBackupArchive(archive)
      if (!integrity.valid) {
        throw new Error(integrity.errors.join(' · ') || 'Sauvegarde corrompue')
      }

      const result = await restoreBackupArchive(archive, {
        userId,
        entities,
        createPreRestoreSnapshot: true,
      })

      await get().refreshSnapshots(userId)
      await emitFeedItem(
        userId,
        {
          kind: 'backup_restored',
          title: 'Restauration effectuée',
          message: `${result.restored.length} section(s) restaurée(s)`,
          href: ROUTES.SETTINGS,
        },
        { toast: true, toastVariant: 'success' },
      )
      toast.success('Restauration réussie', 'Les données ont été importées en sécurité.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec restauration'
      set({ lastError: message })
      await emitFeedItem(
        userId,
        {
          kind: 'backup_failed',
          title: 'Échec restauration',
          message,
          href: ROUTES.SETTINGS,
          severity: 'danger',
        },
        { toast: true, toastVariant: 'error' },
      )
    } finally {
      set({ restoring: false })
    }
  },

  rollback: async (userId, snapshotId) => {
    set({ restoring: true, lastError: null })
    try {
      await rollbackToSnapshot(snapshotId, userId)
      await get().refreshSnapshots(userId)
      await emitFeedItem(
        userId,
        {
          kind: 'backup_restored',
          title: 'Rollback effectué',
          message: 'État précédent restauré',
          href: ROUTES.SETTINGS,
        },
        { toast: true, toastVariant: 'success' },
      )
      toast.success('Rollback réussi')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Rollback impossible'
      set({ lastError: message })
      toast.error('Rollback échoué', message)
    } finally {
      set({ restoring: false })
    }
  },

  removeSnapshot: async (userId, snapshotId) => {
    await deleteBackupSnapshot(snapshotId)
    await get().refreshSnapshots(userId)
    toast.info('Snapshot supprimé')
  },

  runAutoBackupIfDue: async (userId) => {
    const { shouldRunAutoBackup, markAutoBackupCompleted } = await import(
      '@/services/backup/backup-settings.service'
    )
    const settings = get().settings ?? (await getBackupSettings())
    if (!shouldRunAutoBackup(settings)) return

    try {
      const { exportBackup } = await import('@/services/backup/backup-export.service')
      await exportBackup({
        userId,
        format: 'zip',
        source: 'auto',
        label: 'Sauvegarde automatique',
        saveLocalSnapshot: true,
        downloadFile: false,
      })
      await markAutoBackupCompleted()
      await get().refreshSnapshots(userId)
      await emitFeedItem(
        userId,
        {
          kind: 'backup_success',
          title: 'Sauvegarde automatique',
          message: 'Snapshot local + export ZIP créés',
          href: ROUTES.SETTINGS,
          dedupeKey: `auto-backup:${new Date().toISOString().slice(0, 13)}`,
        },
        { dedupe: true },
      )
    } catch (error) {
      console.warn('[backup] auto backup failed', error)
    }
  },
}))
