import { create } from 'zustand'
import type {
  BackupEntityKey,
  BackupFormat,
  BackupLogEntry,
  BackupSettings,
  BackupSnapshotRecord,
  CloudBackupFile,
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
import { runBackupRestoreSelfTest } from '@/services/backup/backup-self-test.service'
import { listCloudBackups, downloadBackupFromCloud } from '@/services/backup/backup-cloud-download.service'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { toast } from '@/store/toast.store'
import { ROUTES } from '@/config/routes'

type BackupStore = {
  snapshots: BackupSnapshotRecord[]
  cloudFiles: CloudBackupFile[]
  settings: BackupSettings | null
  loading: boolean
  loadingCloud: boolean
  cloudError: string | null
  exporting: boolean
  restoring: boolean
  selfTesting: boolean
  lastError: string | null
  restoreLogs: BackupLogEntry[]
  load: (userId: string) => Promise<void>
  refreshSnapshots: (userId: string) => Promise<void>
  refreshCloudFiles: (userId: string) => Promise<void>
  updateSettings: (settings: BackupSettings) => Promise<void>
  createManualBackup: (userId: string, format: BackupFormat, label?: string) => Promise<void>
  exportJson: (userId: string) => Promise<void>
  exportZip: (userId: string) => Promise<void>
  importFile: (userId: string, file: File, entities?: BackupEntityKey[]) => Promise<void>
  dryRunFile: (userId: string, file: File, entities?: BackupEntityKey[]) => Promise<void>
  restoreFromCloud: (userId: string, path: string) => Promise<void>
  rollback: (userId: string, snapshotId: string) => Promise<void>
  removeSnapshot: (userId: string, snapshotId: string) => Promise<void>
  runSelfTest: (userId: string) => Promise<void>
  clearRestoreLogs: () => void
  runAutoBackupIfDue: (userId: string) => Promise<void>
}

function applyRestoreLogs(logs?: BackupLogEntry[]) {
  if (logs?.length) {
    return { restoreLogs: logs }
  }
  return {}
}

export const useBackupStore = create<BackupStore>((set, get) => ({
  snapshots: [],
  cloudFiles: [],
  settings: null,
  loading: false,
  loadingCloud: false,
  cloudError: null,
  exporting: false,
  restoring: false,
  selfTesting: false,
  lastError: null,
  restoreLogs: [],

  load: async (userId) => {
    set({ loading: true, lastError: null })
    try {
      const [settings, snapshots] = await Promise.all([
        getBackupSettings(),
        listBackupSnapshots(userId),
      ])
      set({ settings, snapshots, loading: false })
      if (settings.cloudEnabled) {
        void get().refreshCloudFiles(userId)
      }
    } catch (error) {
      set({
        loading: false,
        lastError: error instanceof Error ? error.message : 'Erreur chargement sauvegardes',
      })
    }
  },

  refreshCloudFiles: async (userId) => {
    set({ loadingCloud: true, cloudError: null })
    try {
      const files = await listCloudBackups(userId)
      set({ cloudFiles: files, loadingCloud: false })
    } catch (error) {
      set({
        loadingCloud: false,
        cloudError: error instanceof Error ? error.message : 'Impossible de lister le cloud',
      })
    }
  },

  refreshSnapshots: async (userId) => {
    const snapshots = await listBackupSnapshots(userId)
    set({ snapshots })
  },

  clearRestoreLogs: () => set({ restoreLogs: [] }),

  updateSettings: async (settings) => {
    await saveBackupSettings(settings)
    set({ settings })
    toast.success('Paramètres sauvegarde enregistrés')
  },

  createManualBackup: async (userId, format, label) => {
    set({ exporting: true, lastError: null })
    try {
      const settings = get().settings ?? (await getBackupSettings())
      const { snapshot, cloudResult } = await downloadBackupExport({
        userId,
        format: format === 'full' ? 'zip' : format,
        label,
        source: 'manual',
      })
      await get().refreshSnapshots(userId)
      if (settings.cloudEnabled) {
        await get().refreshCloudFiles(userId)
      }

      const cloudMsg = cloudResult.ok
        ? `Cloud Supabase OK (${cloudResult.path ?? 'uploadé'})`
        : settings.cloudEnabled
          ? `Cloud non envoyé : ${cloudResult.error ?? 'erreur inconnue'}`
          : undefined

      await emitFeedItem(
        userId,
        {
          kind: 'backup_success',
          title: 'Sauvegarde créée',
          message: cloudMsg ?? snapshot?.label ?? 'Export téléchargé avec succès',
          href: ROUTES.SETTINGS,
          dedupeKey: `backup:${snapshot?.id ?? Date.now()}`,
        },
        { toast: true, toastVariant: 'success' },
      )

      if (cloudResult.ok) {
        toast.success('Sauvegarde terminée', `Fichier local + cloud Supabase (${cloudResult.path})`)
      } else if (settings.cloudEnabled) {
        toast.warning('Sauvegarde locale OK', cloudResult.error ?? 'Upload cloud échoué')
        set({ cloudError: cloudResult.error ?? 'Upload cloud échoué' })
      } else {
        toast.success('Sauvegarde terminée', 'Fichier téléchargé et snapshot local enregistré.')
      }
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
        reloadApp: true,
      })

      set(applyRestoreLogs(result.logs))
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
      toast.success('Restauration réussie', 'Rechargement de l’application…')
    } catch (error) {
      const err = error as Error & { backupLogs?: BackupLogEntry[] }
      const message = err.message || 'Échec restauration'
      set({ lastError: message, ...applyRestoreLogs(err.backupLogs) })
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

  dryRunFile: async (userId, file, entities) => {
    set({ restoring: true, lastError: null })
    try {
      const archive = await parseBackupFile(file)
      const result = await restoreBackupArchive(archive, {
        userId,
        entities,
        dryRun: true,
        createPreRestoreSnapshot: false,
        reloadApp: false,
      })
      set(applyRestoreLogs(result.logs))
      const total = Object.values(result.entityCounts).reduce((a, b) => a + (b ?? 0), 0)
      toast.success(
        'Simulation OK',
        `${result.restored.length} section(s), ~${total} enregistrement(s) — aucune donnée modifiée.`,
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Simulation échouée'
      set({ lastError: message })
      toast.error('Dry-run échoué', message)
    } finally {
      set({ restoring: false })
    }
  },

  restoreFromCloud: async (userId, path) => {
    set({ restoring: true, lastError: null })
    try {
      const archive = await downloadBackupFromCloud(path)
      const integrity = await verifyBackupArchive(archive)
      if (!integrity.valid) {
        throw new Error(integrity.errors.join(' · ') || 'Sauvegarde cloud corrompue')
      }
      const result = await restoreBackupArchive(archive, {
        userId,
        createPreRestoreSnapshot: true,
        reloadApp: true,
      })
      set(applyRestoreLogs(result.logs))
      toast.success('Restauration cloud', 'Rechargement de l’application…')
    } catch (error) {
      const err = error as Error & { backupLogs?: BackupLogEntry[] }
      const message = err.message || 'Restauration cloud échouée'
      set({ lastError: message, ...applyRestoreLogs(err.backupLogs) })
      toast.error('Restauration cloud échouée', message)
    } finally {
      set({ restoring: false })
    }
  },

  rollback: async (userId, snapshotId) => {
    set({ restoring: true, lastError: null })
    try {
      const result = await rollbackToSnapshot(snapshotId, userId)
      set(applyRestoreLogs(result.logs))
      await get().refreshSnapshots(userId)
      await emitFeedItem(
        userId,
        {
          kind: 'backup_restored',
          title: 'Rollback effectué',
          message: 'État précédent restauré — rechargement…',
          href: ROUTES.SETTINGS,
        },
        { toast: true, toastVariant: 'success' },
      )
      toast.success('Rollback réussi', 'Rechargement de l’application…')
    } catch (error) {
      const err = error as Error & { backupLogs?: BackupLogEntry[] }
      const message = err.message || 'Rollback impossible'
      set({ lastError: message, ...applyRestoreLogs(err.backupLogs) })
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

  runSelfTest: async (userId) => {
    set({ selfTesting: true, lastError: null })
    try {
      const result = await runBackupRestoreSelfTest(userId)
      if (!result.passed) {
        throw new Error(result.error ?? 'Test échoué')
      }
      toast.success('Test backup réussi', result.steps.join(' → '))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Test échoué'
      set({ lastError: message })
      toast.error('Test backup échoué', message)
    } finally {
      set({ selfTesting: false })
    }
  },

  runAutoBackupIfDue: async (userId) => {
    const { shouldRunAutoBackup, markAutoBackupCompleted } = await import(
      '@/services/backup/backup-settings.service'
    )
    const settings = get().settings ?? (await getBackupSettings())
    if (!shouldRunAutoBackup(settings)) return

    try {
      const { exportBackup } = await import('@/services/backup/backup-export.service')
      const { cloudResult } = await exportBackup({
        userId,
        format: 'zip',
        source: 'auto',
        label: 'Sauvegarde automatique',
        saveLocalSnapshot: true,
        downloadFile: false,
      })
      await markAutoBackupCompleted()
      await get().refreshSnapshots(userId)
      if (settings.cloudEnabled) {
        await get().refreshCloudFiles(userId)
      }
      if (settings.cloudEnabled && !cloudResult.ok) {
        console.warn('[backup] auto cloud upload failed', cloudResult.error)
      }
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
