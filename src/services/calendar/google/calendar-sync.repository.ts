import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type {
  CalendarSyncLink,
  GoogleCalendarQueueItem,
} from '@/services/calendar/google/google-calendar.types'

export const calendarSyncRepository = {
  async getLink(interventionId: string): Promise<CalendarSyncLink | undefined> {
    const db = await getDb()
    return db.get(STORES.calendarSyncLinks, interventionId)
  },

  async getLinkByGoogleEventId(googleEventId: string): Promise<CalendarSyncLink | undefined> {
    const db = await getDb()
    const all = await db.getAll(STORES.calendarSyncLinks)
    return all.find((link) => link.googleEventId === googleEventId)
  },

  async saveLink(link: CalendarSyncLink): Promise<void> {
    const db = await getDb()
    await db.put(STORES.calendarSyncLinks, link)
  },

  async removeLink(interventionId: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.calendarSyncLinks, interventionId)
  },

  async listLinks(): Promise<CalendarSyncLink[]> {
    const db = await getDb()
    return db.getAll(STORES.calendarSyncLinks)
  },

  async listConflicts(): Promise<CalendarSyncLink[]> {
    const links = await this.listLinks()
    return links.filter((link) => link.status === 'conflict')
  },

  async enqueue(item: GoogleCalendarQueueItem): Promise<void> {
    const db = await getDb()
    await db.put(STORES.googleCalendarQueue, item)
  },

  async dequeue(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.googleCalendarQueue, id)
  },

  async listQueue(): Promise<GoogleCalendarQueueItem[]> {
    const db = await getDb()
    return db.getAll(STORES.googleCalendarQueue)
  },
}
