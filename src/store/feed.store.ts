import { create } from 'zustand'
import type { ActivityFeedItem } from '@/types/entities'
import { activityFeedRepository } from '@/services/database/repositories/activity-feed.repository'

function countUnread(items: ActivityFeedItem[]): number {
  return items.filter((item) => !item.read && !item.archived).length
}

function sortItems(items: ActivityFeedItem[]): ActivityFeedItem[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

type FeedStore = {
  items: ActivityFeedItem[]
  loading: boolean
  panelOpen: boolean
  unreadCount: number
  load: () => Promise<void>
  upsertItem: (item: ActivityFeedItem) => void
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  archive: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  items: [],
  loading: false,
  panelOpen: false,
  unreadCount: 0,

  load: async () => {
    set({ loading: true })
    try {
      const items = await activityFeedRepository.list()
      set({ items, unreadCount: countUnread(items) })
    } catch (error) {
      console.error('[feed] load failed:', error)
      set({ items: [], unreadCount: 0 })
    } finally {
      set({ loading: false })
    }
  },

  upsertItem: (item) => {
    const items = sortItems([
      item,
      ...get().items.filter((existing) => existing.id !== item.id),
    ])
    set({ items, unreadCount: countUnread(items) })
  },

  setPanelOpen: (open) => set({ panelOpen: open }),

  togglePanel: () => set({ panelOpen: !get().panelOpen }),

  markRead: async (id) => {
    const updated = await activityFeedRepository.update(id, { read: true })
    if (!updated) return
    const items = get().items.map((item) => (item.id === id ? updated : item))
    set({ items, unreadCount: countUnread(items) })
  },

  markAllRead: async () => {
    const targets = get().items.filter((item) => !item.read && !item.archived)
    await Promise.all(targets.map((item) => activityFeedRepository.update(item.id, { read: true })))
    const items = get().items.map((item) =>
      item.archived ? item : { ...item, read: true },
    )
    set({ items, unreadCount: 0 })
  },

  archive: async (id) => {
    const updated = await activityFeedRepository.update(id, { archived: true, read: true })
    if (!updated) return
    const items = get().items.map((item) => (item.id === id ? updated : item))
    set({ items, unreadCount: countUnread(items) })
  },

  remove: async (id) => {
    await activityFeedRepository.remove(id)
    const items = get().items.filter((item) => item.id !== id)
    set({ items, unreadCount: countUnread(items) })
  },
}))

/** @deprecated Utiliser useFeedStore */
export const useNotificationsStore = useFeedStore

export type AppNotification = ActivityFeedItem
