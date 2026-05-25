import type { ActivityFeedItem, ActivityFeedItemInsert } from '@/types/entities'
import { getDb, getMeta, setMeta } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'
import { isMissingSchemaError } from '@/services/sync/sync-errors'

const MAX_LOCAL_ITEMS = 300
const FEED_REMOTE_BLOCKED_KEY = 'activity_feed_remote_blocked'

async function isFeedRemoteBlocked(): Promise<boolean> {
  return Boolean(await getMeta<boolean>(FEED_REMOTE_BLOCKED_KEY))
}

async function markFeedRemoteBlocked(): Promise<void> {
  await setMeta(FEED_REMOTE_BLOCKED_KEY, true)
}

async function clearFeedRemoteBlocked(): Promise<void> {
  await setMeta(FEED_REMOTE_BLOCKED_KEY, false)
}

async function enqueueFeedSync(
  input: Parameters<typeof syncService.enqueue>[0],
): Promise<void> {
  if (await isFeedRemoteBlocked()) return
  await syncService.enqueue(input)
}

function mapRow(row: Record<string, unknown>): ActivityFeedItem {
  const kind = String(row.kind ?? 'sync_success') as ActivityFeedItem['kind']
  const severity = String(row.severity ?? 'info') as ActivityFeedItem['severity']

  return {
    id: String(row.id),
    kind,
    title: String(row.title ?? 'Événement'),
    message: (row.message as string | null) ?? undefined,
    severity,
    href: (row.href as string | null) ?? undefined,
    entityType: (row.entity_type as string | null) ?? undefined,
    entityId: (row.entity_id as string | null) ?? undefined,
    dedupeKey: (row.dedupe_key as string | null) ?? undefined,
    read: Boolean(row.read),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    userId: String(row.user_id ?? row.userId ?? ''),
  }
}

function buildInsertRow(payload: ActivityFeedItemInsert & { userId: string }): Record<string, unknown> {
  return {
    kind: payload.kind,
    title: payload.title,
    message: payload.message ?? null,
    severity: payload.severity,
    href: payload.href ?? null,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    dedupe_key: payload.dedupeKey ?? null,
    read: false,
    archived: false,
    user_id: payload.userId,
  }
}

function sortByDateDesc(items: ActivityFeedItem[]): ActivityFeedItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

async function trimLocalStore(items: ActivityFeedItem[]): Promise<ActivityFeedItem[]> {
  const sorted = sortByDateDesc(items).slice(0, MAX_LOCAL_ITEMS)
  const db = await getDb()
  const tx = db.transaction(STORES.activityFeed, 'readwrite')
  await tx.store.clear()
  for (const item of sorted) {
    await tx.store.put(item)
  }
  await tx.done
  return sorted
}

export const activityFeedRepository = {
  async listLocal(): Promise<ActivityFeedItem[]> {
    const db = await getDb()
    return sortByDateDesc(await db.getAll(STORES.activityFeed))
  },

  async upsertLocal(item: ActivityFeedItem): Promise<void> {
    const db = await getDb()
    await db.put(STORES.activityFeed, item)
  },

  async removeLocal(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.activityFeed, id)
  },

  async findByDedupeKey(dedupeKey: string, userId: string): Promise<ActivityFeedItem | null> {
    const items = await this.listLocal()
    const found = items.find(
      (item) => item.dedupeKey === dedupeKey && item.userId === userId && !item.archived,
    )
    return found ?? null
  },

  async list(): Promise<ActivityFeedItem[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }
    try {
      const rows = await databaseService.list('activity_feed')
      const items = rows.map((row) => mapRow(row as Record<string, unknown>))
      const sorted = sortByDateDesc(items)
      try {
        await trimLocalStore(sorted)
      } catch (error) {
        console.warn('[activity_feed] cache trim failed:', error)
      }
      await clearFeedRemoteBlocked()
      return sorted
    } catch (error) {
      console.warn('[activity_feed] remote list failed, using local cache:', error)
      return this.listLocal()
    }
  },

  async create(payload: ActivityFeedItemInsert & { userId: string }): Promise<ActivityFeedItem> {
    const now = new Date().toISOString()
    const localItem: ActivityFeedItem = {
      id: crypto.randomUUID(),
      ...payload,
      read: false,
      archived: false,
      createdAt: now,
    }
    const row = { id: localItem.id, ...buildInsertRow(payload), created_at: now }

    await this.upsertLocal(localItem)
    const all = await this.listLocal()
    if (all.length > MAX_LOCAL_ITEMS) {
      await trimLocalStore(sortByDateDesc(all).slice(0, MAX_LOCAL_ITEMS))
    }

    if (!databaseService.isAvailable()) {
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'create',
        entityId: localItem.id,
        payload: row,
      })
      return localItem
    }

    try {
      const created = await databaseService.insert('activity_feed', row)
      const mapped = mapRow(created as Record<string, unknown>)
      await this.upsertLocal(mapped)
      await clearFeedRemoteBlocked()
      return mapped
    } catch (error) {
      if (isMissingSchemaError(error)) {
        await markFeedRemoteBlocked()
        return localItem
      }
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'create',
        entityId: localItem.id,
        payload: row,
      })
      return localItem
    }
  },

  async update(id: string, patch: Partial<Pick<ActivityFeedItem, 'read' | 'archived'>>) {
    const existing = (await this.listLocal()).find((item) => item.id === id)
    if (!existing) return null

    const updated: ActivityFeedItem = { ...existing, ...patch }
    await this.upsertLocal(updated)

    const row: Record<string, unknown> = {}
    if (patch.read !== undefined) row.read = patch.read
    if (patch.archived !== undefined) row.archived = patch.archived

    if (!databaseService.isAvailable()) {
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }

    try {
      const result = await databaseService.update('activity_feed', id, row)
      const mapped = mapRow(result as Record<string, unknown>)
      await this.upsertLocal(mapped)
      await clearFeedRemoteBlocked()
      return mapped
    } catch (error) {
      if (isMissingSchemaError(error)) {
        await markFeedRemoteBlocked()
        return updated
      }
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'update',
        entityId: id,
        payload: row,
      })
      return updated
    }
  },

  async remove(id: string): Promise<void> {
    await this.removeLocal(id)
    if (!databaseService.isAvailable()) {
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }
    try {
      await databaseService.remove('activity_feed', id)
      await clearFeedRemoteBlocked()
    } catch (error) {
      if (isMissingSchemaError(error)) {
        await markFeedRemoteBlocked()
        return
      }
      await enqueueFeedSync({
        entity: 'activity_feed',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
    }
  },
}
