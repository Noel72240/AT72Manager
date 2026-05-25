import type { PortalDataSnapshot } from '@/types/portal.types'

const CACHE_KEY_PREFIX = 'at72_portal_snapshot_'
const useWebStorage = import.meta.env.VITE_PORTAL_STANDALONE === 'true'

function cacheKey(clientId: string): string {
  return `${CACHE_KEY_PREFIX}${clientId}`
}

async function saveToIdb(snapshot: PortalDataSnapshot): Promise<void> {
  const { getDb } = await import('@/services/indexeddb/db')
  const { STORES } = await import('@/services/indexeddb/schema')
  const db = await getDb()
  await db.put(STORES.portalCache, snapshot, cacheKey(snapshot.clientId))
}

async function loadFromIdb(clientId: string): Promise<PortalDataSnapshot | null> {
  try {
    const { getDb } = await import('@/services/indexeddb/db')
    const { STORES } = await import('@/services/indexeddb/schema')
    const db = await getDb()
    return (await db.get(STORES.portalCache, cacheKey(clientId))) ?? null
  } catch {
    return null
  }
}

export const portalCacheService = {
  async save(snapshot: PortalDataSnapshot): Promise<void> {
    if (useWebStorage) {
      try {
        localStorage.setItem(cacheKey(snapshot.clientId), JSON.stringify(snapshot))
      } catch {
        /* quota */
      }
      return
    }
    await saveToIdb(snapshot)
  },

  async load(clientId: string): Promise<PortalDataSnapshot | null> {
    if (useWebStorage) {
      try {
        const raw = localStorage.getItem(cacheKey(clientId))
        if (!raw) return null
        return JSON.parse(raw) as PortalDataSnapshot
      } catch {
        return null
      }
    }
    return loadFromIdb(clientId)
  },

  async clear(clientId: string): Promise<void> {
    if (useWebStorage) {
      localStorage.removeItem(cacheKey(clientId))
      return
    }
    try {
      const { getDb } = await import('@/services/indexeddb/db')
      const { STORES } = await import('@/services/indexeddb/schema')
      const db = await getDb()
      await db.delete(STORES.portalCache, cacheKey(clientId))
    } catch {
      /* ignore */
    }
  },
}
