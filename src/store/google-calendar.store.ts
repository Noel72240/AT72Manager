import { create } from 'zustand'
import { googleCalendarApi } from '@/services/calendar/google/google-calendar-api.service'
import { googleCalendarAuthService } from '@/services/calendar/google/google-calendar-auth.service'
import { googleCalendarSyncService } from '@/services/calendar/google/google-calendar-sync.service'
import { calendarSyncRepository } from '@/services/calendar/google/calendar-sync.repository'
import type {
  CalendarSyncLink,
  GoogleCalendarListEntry,
  GoogleCalendarSettings,
  GoogleCalendarSyncStatus,
} from '@/services/calendar/google/google-calendar.types'
import { DEFAULT_GOOGLE_CALENDAR_SETTINGS } from '@/services/calendar/google/google-calendar.types'
import { toast } from '@/store/toast.store'

type GoogleCalendarStore = {
  settings: GoogleCalendarSettings
  status: GoogleCalendarSyncStatus
  connected: boolean
  configured: boolean
  calendars: GoogleCalendarListEntry[]
  conflicts: CalendarSyncLink[]
  queueSize: number
  syncing: boolean
  connecting: boolean
  lastResult: string | null
  load: () => Promise<void>
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  refreshCalendars: () => Promise<void>
  updateSettings: (patch: Partial<GoogleCalendarSettings>) => Promise<void>
  syncNow: () => Promise<void>
  pushIntervention: (interventionId: string) => Promise<void>
  resolveConflict: (interventionId: string, resolution: 'keep_at72' | 'keep_google') => Promise<void>
}

export const useGoogleCalendarStore = create<GoogleCalendarStore>((set, get) => ({
  settings: DEFAULT_GOOGLE_CALENDAR_SETTINGS,
  status: 'disconnected',
  connected: false,
  configured: false,
  calendars: [],
  conflicts: [],
  queueSize: 0,
  syncing: false,
  connecting: false,
  lastResult: null,

  load: async () => {
    const configured = googleCalendarAuthService.isConfigured()
    const settings = await googleCalendarSyncService.getSettings()
    const connected = configured ? await googleCalendarSyncService.isConnected() : false
    const conflicts = await calendarSyncRepository.listConflicts()
    const queueSize = (await calendarSyncRepository.listQueue()).length
    const { syncing, connecting } = get()

    let status: GoogleCalendarSyncStatus = 'disconnected'
    if (syncing || connecting) {
      status = 'syncing'
    } else if (!configured) {
      status = 'disconnected'
    } else if (!navigator.onLine) {
      status = 'offline'
    } else if (connected) {
      status = settings.lastSyncError ? 'error' : 'connected'
    } else {
      status = 'disconnected'
    }

    set({
      settings,
      configured,
      connected,
      status,
      conflicts,
      queueSize,
    })
  },

  connect: async () => {
    if (get().connecting) return
    set({ connecting: true, status: 'syncing' })
    try {
      await googleCalendarAuthService.connect()
      const calendars = await googleCalendarApi.listCalendars()
      const primary = calendars.find((c) => c.primary) ?? calendars[0]
      const settings = {
        ...(await googleCalendarSyncService.getSettings()),
        enabled: true,
        targetCalendarId: primary?.id ?? 'primary',
        targetCalendarName: primary?.summary ?? 'Agenda principal',
      }
      await googleCalendarSyncService.saveSettings(settings)
      set({
        connected: true,
        status: 'connected',
        calendars,
        settings,
      })
      toast.success('Google Calendar connecté')
    } catch (error) {
      set({ status: 'error', connected: false })
      toast.error(
        'Connexion Google échouée',
        error instanceof Error ? error.message : 'Erreur inconnue',
      )
      throw error
    } finally {
      set({ connecting: false })
      if (!get().connected && !get().syncing) {
        set({ status: 'disconnected' })
      }
    }
  },

  disconnect: async () => {
    await googleCalendarAuthService.clearTokens()
    await googleCalendarSyncService.saveSettings({
      ...get().settings,
      enabled: false,
    })
    set({
      connected: false,
      status: 'disconnected',
      calendars: [],
      settings: { ...get().settings, enabled: false },
    })
    toast.info('Google Calendar déconnecté')
  },

  refreshCalendars: async () => {
    if (!(await googleCalendarSyncService.isConnected())) return
    const calendars = await googleCalendarApi.listCalendars()
    set({ calendars })
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch }
    await googleCalendarSyncService.saveSettings(next)
    set({ settings: next })
    toast.success('Paramètres Google Calendar enregistrés')
  },

  syncNow: async () => {
    const { settings, connected, syncing, connecting } = get()
    if (!settings.enabled || !connected || syncing || connecting) return

    set({ syncing: true, status: 'syncing' })
    try {
      const result = await googleCalendarSyncService.syncAll()
      const conflicts = await calendarSyncRepository.listConflicts()
      const queueSize = (await calendarSyncRepository.listQueue()).length
      const summary = `${result.pushed} envoyé(s) · ${result.pulled} reçu(s) · ${result.conflicts} conflit(s)`
      set({
        syncing: false,
        status: result.errors.length ? 'error' : 'connected',
        conflicts,
        queueSize,
        lastResult: summary,
        settings: await googleCalendarSyncService.getSettings(),
      })
      if (result.errors.length) {
        toast.warning('Synchronisation partielle', result.errors[0])
      } else if (result.pushed > 0 || result.pulled > 0) {
        toast.success('Synchronisation terminée', summary)
      }
    } catch (error) {
      set({ syncing: false, status: 'error' })
      toast.error(
        'Synchronisation échouée',
        error instanceof Error ? error.message : 'Erreur inconnue',
      )
    }
  },

  pushIntervention: async (interventionId) => {
    if (!get().settings.enabled) return
    try {
      await googleCalendarSyncService.pushIntervention(interventionId)
      const queueSize = (await calendarSyncRepository.listQueue()).length
      set({ queueSize })
    } catch {
      /* erreur déjà persistée sur le lien */
    }
  },

  resolveConflict: async (interventionId, resolution) => {
    await googleCalendarSyncService.resolveConflict(interventionId, resolution)
    const conflicts = await calendarSyncRepository.listConflicts()
    set({ conflicts })
    toast.success('Conflit résolu')
  },
}))
