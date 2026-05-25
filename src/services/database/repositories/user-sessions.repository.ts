import { getDb, setMeta } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { UserSessionRecord } from '@/types/audit.types'
import { getDeviceFingerprint, getDeviceLabel, getSessionMetaKey } from '@/utils/device'
import { databaseService } from '@/services/database/database.service'
import { env } from '@/config/env'


export const userSessionsRepository = {
  async getLocal(id: string): Promise<UserSessionRecord | undefined> {
    const db = await getDb()
    return db.get(STORES.userSessions, id)
  },

  async upsertLocal(session: UserSessionRecord): Promise<void> {
    const db = await getDb()
    await db.put(STORES.userSessions, session)
  },

  async listActiveForUser(userId: string): Promise<UserSessionRecord[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.userSessions)
    return all.filter((session) => session.userId === userId && session.isActive)
  },

  async startSession(userId: string, workshopId?: string): Promise<UserSessionRecord> {
    const now = new Date().toISOString()
    const fingerprint = getDeviceFingerprint()
    const session: UserSessionRecord = {
      id: crypto.randomUUID(),
      userId,
      workshopId,
      deviceLabel: getDeviceLabel(),
      deviceFingerprint: fingerprint,
      startedAt: now,
      lastActiveAt: now,
      isActive: true,
    }

    await this.upsertLocal(session)
    await setMeta(getSessionMetaKey(userId), session.id)

    if (env.isSupabaseConfigured && navigator.onLine) {
      try {
        await databaseService.insert('user_sessions' as never, {
          id: session.id,
          user_id: userId,
          workshop_id: workshopId ?? null,
          device_label: session.deviceLabel,
          device_fingerprint: fingerprint,
          started_at: now,
          last_active_at: now,
          is_active: true,
        })
      } catch (error) {
        console.warn('[session] sync différée:', error)
      }
    }

    return session
  },

  async touchSession(sessionId: string): Promise<void> {
    const session = await this.getLocal(sessionId)
    if (!session || !session.isActive) return

    const now = new Date().toISOString()
    const updated = { ...session, lastActiveAt: now }
    await this.upsertLocal(updated)

    if (env.isSupabaseConfigured && navigator.onLine) {
      try {
        await databaseService.update('user_sessions' as never, sessionId, {
          last_active_at: now,
        })
      } catch {
        /* offline */
      }
    }
  },

  async endSession(sessionId: string): Promise<void> {
    const session = await this.getLocal(sessionId)
    if (!session) return

    const now = new Date().toISOString()
    const updated: UserSessionRecord = { ...session, isActive: false, endedAt: now, lastActiveAt: now }
    await this.upsertLocal(updated)

    if (env.isSupabaseConfigured && navigator.onLine) {
      try {
        await databaseService.update('user_sessions' as never, sessionId, {
          is_active: false,
          ended_at: now,
          last_active_at: now,
        })
      } catch {
        /* offline */
      }
    }
  },

  async endActiveSessions(userId: string): Promise<void> {
    const active = await this.listActiveForUser(userId)
    await Promise.all(active.map((session) => this.endSession(session.id)))
  },

  async listWorkshopSessions(workshopId: string): Promise<UserSessionRecord[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.userSessions)
    return all
      .filter((session) => session.workshopId === workshopId)
      .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt))
  },
}
