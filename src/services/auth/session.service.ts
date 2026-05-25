import { getDb, getMeta } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { userSessionsRepository } from '@/services/database/repositories/user-sessions.repository'
import { getSessionMetaKey } from '@/utils/device'

const ENTITY_STORES = [
  STORES.clients,
  STORES.interventions,
  STORES.devices,
  STORES.interventionPhotos,
  STORES.quotes,
  STORES.invoices,
  STORES.spareParts,
  STORES.stockMovements,
  STORES.activityFeed,
  STORES.aiConversations,
  STORES.backupSnapshots,
  STORES.syncQueue,
] as const

export const sessionService = {
  async start(userId: string, workshopId?: string) {
    return userSessionsRepository.startSession(userId, workshopId)
  },

  async touch(userId: string) {
    const sessionId = await getMeta<string>(getSessionMetaKey(userId))
    if (sessionId) {
      await userSessionsRepository.touchSession(sessionId)
    }
  },

  async end(userId: string) {
    await userSessionsRepository.endActiveSessions(userId)
  },

  async listWorkshop(workshopId: string) {
    return userSessionsRepository.listWorkshopSessions(workshopId)
  },
}

/** Isolation multi-PC / multi-utilisateur — purge données métier locales au changement de session */
export const sessionIsolationService = {
  async clearBusinessData(): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(ENTITY_STORES, 'readwrite')
    await Promise.all([
      ...ENTITY_STORES.map((store) => tx.objectStore(store).clear()),
      tx.done,
    ])
  },
}
