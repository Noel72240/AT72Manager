import { getMeta, setMeta } from '@/services/indexeddb/db'
import { googleCalendarApi } from '@/services/calendar/google/google-calendar-api.service'
import { googleCalendarAuthService } from '@/services/calendar/google/google-calendar-auth.service'
import {
  googleEventToInterventionPatch,
  interventionToGoogleEvent,
} from '@/services/calendar/google/google-calendar.mapper'
import { calendarSyncRepository } from '@/services/calendar/google/calendar-sync.repository'
import { detectSyncConflict, markConflict } from '@/services/calendar/google/google-calendar.conflict'
import { clientsRepository } from '@/services/database/repositories/clients.repository'
import { interventionsRepository } from '@/services/database/repositories/interventions.repository'
import { profilesRepository } from '@/services/database/repositories/profiles.repository'
import type {
  GoogleCalendarSettings,
  GoogleCalendarSyncResult,
} from '@/services/calendar/google/google-calendar.types'
import {
  DEFAULT_GOOGLE_CALENDAR_SETTINGS,
  META_GOOGLE_SETTINGS,
} from '@/services/calendar/google/google-calendar.types'

const MAX_QUEUE_RETRIES = 5

function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

function isSchedulable(intervention: { scheduledAt?: string | null }): boolean {
  return Boolean(intervention.scheduledAt)
}

export const googleCalendarSyncService = {
  async getSettings(): Promise<GoogleCalendarSettings> {
    return (await getMeta<GoogleCalendarSettings>(META_GOOGLE_SETTINGS)) ?? DEFAULT_GOOGLE_CALENDAR_SETTINGS
  },

  async saveSettings(settings: GoogleCalendarSettings): Promise<void> {
    await setMeta(META_GOOGLE_SETTINGS, settings)
  },

  async isConnected(): Promise<boolean> {
    if (!googleCalendarAuthService.isConfigured()) return false
    const token = await googleCalendarAuthService.getValidAccessToken()
    return Boolean(token)
  },

  async enqueueOffline(
    interventionId: string,
    action: 'create' | 'update' | 'delete',
  ): Promise<void> {
    await calendarSyncRepository.enqueue({
      id: crypto.randomUUID(),
      interventionId,
      action,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    })
  },

  async processQueue(): Promise<number> {
    const settings = await this.getSettings()
    if (!settings.enabled) return 0

    const queue = await calendarSyncRepository.listQueue()
    let processed = 0

    for (const item of queue) {
      try {
        if (item.action === 'delete') {
          await this.deleteFromGoogle(item.interventionId)
        } else {
          const intervention = await interventionsRepository.getLocal(item.interventionId)
          if (intervention && isSchedulable(intervention)) {
            await this.pushIntervention(intervention.id)
          }
        }
        await calendarSyncRepository.dequeue(item.id)
        processed += 1
      } catch (error) {
        const retryCount = item.retryCount + 1
        if (retryCount >= MAX_QUEUE_RETRIES) {
          await calendarSyncRepository.dequeue(item.id)
        } else {
          await calendarSyncRepository.enqueue({
            ...item,
            retryCount,
            lastError: error instanceof Error ? error.message : String(error),
          })
          await calendarSyncRepository.dequeue(item.id)
        }
      }
    }

    return processed
  },

  async pushIntervention(interventionId: string): Promise<void> {
    const settings = await this.getSettings()
    if (!settings.enabled) return

    const intervention = await interventionsRepository.getLocal(interventionId)
    if (!intervention || !isSchedulable(intervention)) return

    if (!isOnline()) {
      await this.enqueueOffline(interventionId, 'update')
      return
    }

    const connected = await this.isConnected()
    if (!connected) {
      await this.enqueueOffline(interventionId, 'update')
      return
    }

    const client = intervention.clientId
      ? await clientsRepository.getLocal(intervention.clientId)
      : null

    let technicianName: string | undefined
    if (intervention.assignedTechnicianId) {
      const profile = await profilesRepository.getLocal(intervention.assignedTechnicianId)
      technicianName = profile?.fullName ?? profile?.email
    }

    const payload = interventionToGoogleEvent(intervention, client ?? null, {
      technicianName,
      reminderMinutes: settings.defaultReminderMinutes,
    })

    const existingLink = await calendarSyncRepository.getLink(interventionId)
    const calendarId = settings.targetCalendarId

    try {
      if (existingLink?.googleEventId) {
        const remote = await googleCalendarApi.updateEvent(
          calendarId,
          existingLink.googleEventId,
          payload,
        )
        await calendarSyncRepository.saveLink({
          interventionId,
          googleEventId: remote.id,
          googleCalendarId: calendarId,
          etag: remote.etag,
          googleUpdatedAt: remote.updated,
          at72UpdatedAt: intervention.updatedAt,
          status: 'synced',
          lastSyncedAt: new Date().toISOString(),
        })
      } else {
        const remote = await googleCalendarApi.createEvent(calendarId, payload)
        await calendarSyncRepository.saveLink({
          interventionId,
          googleEventId: remote.id,
          googleCalendarId: calendarId,
          etag: remote.etag,
          googleUpdatedAt: remote.updated,
          at72UpdatedAt: intervention.updatedAt,
          status: 'synced',
          lastSyncedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      await calendarSyncRepository.saveLink({
        interventionId,
        googleEventId: existingLink?.googleEventId ?? '',
        googleCalendarId: calendarId,
        status: 'failed',
        lastError: error instanceof Error ? error.message : String(error),
        lastSyncedAt: existingLink?.lastSyncedAt,
      })
      throw error
    }
  },

  async deleteFromGoogle(interventionId: string): Promise<void> {
    const settings = await this.getSettings()
    if (!settings.enabled) return

    const link = await calendarSyncRepository.getLink(interventionId)
    if (!link?.googleEventId) {
      await calendarSyncRepository.removeLink(interventionId)
      return
    }

    if (!isOnline() || !(await this.isConnected())) {
      await this.enqueueOffline(interventionId, 'delete')
      return
    }

    try {
      await googleCalendarApi.deleteEvent(link.googleCalendarId, link.googleEventId)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!message.includes('404')) throw error
    }

    await calendarSyncRepository.removeLink(interventionId)
  },

  async pullChanges(): Promise<number> {
    const settings = await this.getSettings()
    if (!settings.enabled || !settings.bidirectional) return 0
    if (!isOnline() || !(await this.isConnected())) return 0

    const updatedMin =
      settings.lastSyncAt ??
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const events = await googleCalendarApi.listUpdatedEvents(
      settings.targetCalendarId,
      updatedMin,
    )

    let pulled = 0

    for (const event of events) {
      if (event.status === 'cancelled') continue

      const interventionId = event.extendedProperties?.private?.at72_intervention_id
      let link = interventionId
        ? await calendarSyncRepository.getLink(interventionId)
        : await calendarSyncRepository.getLinkByGoogleEventId(event.id)

      if (!link && interventionId) {
        link = {
          interventionId,
          googleEventId: event.id,
          googleCalendarId: settings.targetCalendarId,
          status: 'pending_pull',
        }
      }

      if (!link) continue

      const intervention = await interventionsRepository.getLocal(link.interventionId)
      if (!intervention) continue

      if (detectSyncConflict(link, intervention.updatedAt, event.updated)) {
        await calendarSyncRepository.saveLink(
          markConflict(link, 'google'),
        )
        continue
      }

      const patch = googleEventToInterventionPatch(event)
      if (Object.keys(patch).length === 0) continue

      await interventionsRepository.update(link.interventionId, patch)

      await calendarSyncRepository.saveLink({
        ...link,
        googleEventId: event.id,
        etag: event.etag,
        googleUpdatedAt: event.updated,
        at72UpdatedAt: intervention.updatedAt,
        status: 'synced',
        lastSyncedAt: new Date().toISOString(),
      })

      pulled += 1
    }

    return pulled
  },

  async resolveConflict(
    interventionId: string,
    resolution: 'keep_at72' | 'keep_google',
  ): Promise<void> {
    const link = await calendarSyncRepository.getLink(interventionId)
    if (!link || link.status !== 'conflict') return

    if (resolution === 'keep_at72') {
      await this.pushIntervention(interventionId)
      return
    }

    const event = await googleCalendarApi.getEvent(link.googleCalendarId, link.googleEventId)
    const patch = googleEventToInterventionPatch(event)
    await interventionsRepository.update(interventionId, patch)

    await calendarSyncRepository.saveLink({
      ...link,
      status: 'synced',
      conflictSource: undefined,
      googleUpdatedAt: event.updated,
      lastSyncedAt: new Date().toISOString(),
    })
  },

  async syncAll(): Promise<GoogleCalendarSyncResult> {
    const settings = await this.getSettings()
    const result: GoogleCalendarSyncResult = {
      pushed: 0,
      pulled: 0,
      conflicts: 0,
      failed: 0,
      errors: [],
    }

    if (!settings.enabled) return result

    try {
      result.pushed += await this.processQueue()

      const interventions = await interventionsRepository.listLocal()
      for (const intervention of interventions) {
        if (!isSchedulable(intervention)) continue
        try {
          await this.pushIntervention(intervention.id)
          result.pushed += 1
        } catch (error) {
          result.failed += 1
          result.errors.push(
            `${intervention.id}: ${error instanceof Error ? error.message : String(error)}`,
          )
        }
      }

      result.pulled = await this.pullChanges()
      result.conflicts = (await calendarSyncRepository.listConflicts()).length

      await this.saveSettings({
        ...settings,
        lastSyncAt: new Date().toISOString(),
        lastSyncError: result.errors[0],
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(message)
      await this.saveSettings({ ...settings, lastSyncError: message })
    }

    return result
  },
}
