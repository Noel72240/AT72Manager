import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { Client } from '@/types/entities'
import { buildBackupArchive } from '@/services/backup/backup-export.service'
import { restoreBackupArchiveSafe } from '@/services/backup/backup-restore-engine.service'
import { ALL_BACKUP_ENTITY_KEYS } from '@/services/backup/backup.types'

export type BackupSelfTestResult = {
  passed: boolean
  steps: string[]
  error?: string
}

const TEST_CLIENT_ID = '__backup_self_test_client__'

export async function runBackupRestoreSelfTest(userId: string): Promise<BackupSelfTestResult> {
  const steps: string[] = []

  try {
    const db = await getDb()
    const testClient: Client = {
      id: TEST_CLIENT_ID,
      userId,
      firstName: 'Test',
      lastName: 'Backup',
      status: 'active',
      email: 'backup-test@local.invalid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    steps.push('1. Création client test')
    await db.put(STORES.clients, testClient)

    steps.push('2. Export archive')
    const archive = await buildBackupArchive(userId, 'Self-test', 'manual')
    if (!archive.data.clients.some((c) => (c as Client).id === TEST_CLIENT_ID)) {
      throw new Error('Client test absent de l’export')
    }

    steps.push('3. Suppression client test')
    await db.delete(STORES.clients, TEST_CLIENT_ID)
    const gone = await db.get(STORES.clients, TEST_CLIENT_ID)
    if (gone) throw new Error('Client test non supprimé')

    steps.push('4. Restauration (clients uniquement)')
    await restoreBackupArchiveSafe(archive, {
      userId,
      entities: ['clients'],
      createPreRestoreSnapshot: false,
      reloadApp: false,
      skipIntegrityCheck: false,
    })

    steps.push('5. Vérification')
    const restored = await db.get(STORES.clients, TEST_CLIENT_ID)
    if (!restored) throw new Error('Client test non restauré')

    steps.push('6. Nettoyage')
    await db.delete(STORES.clients, TEST_CLIENT_ID)

    steps.push('7. Dry-run complet')
    const dry = await restoreBackupArchiveSafe(archive, {
      userId,
      entities: ALL_BACKUP_ENTITY_KEYS,
      dryRun: true,
      createPreRestoreSnapshot: false,
      reloadApp: false,
    })
    if (!dry.dryRun) throw new Error('Dry-run non signalé')

    steps.push('OK — tous les tests passés')
    return { passed: true, steps }
  } catch (error) {
    try {
      const db = await getDb()
      await db.delete(STORES.clients, TEST_CLIENT_ID)
    } catch {
      /* ignore */
    }
    return {
      passed: false,
      steps,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
