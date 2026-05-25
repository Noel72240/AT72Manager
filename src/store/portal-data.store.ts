import { create } from 'zustand'
import { portalApiService } from '@/services/portal/portal-api.service'
import { portalCacheService } from '@/services/portal/portal-cache.service'
import type { Client, Device, Intervention, Invoice, Quote } from '@/types/entities'
import type { PortalMessage, PortalNotification, PortalRepairEvent } from '@/types/portal.types'

type PortalDataStore = {
  loading: boolean
  offline: boolean
  fromCache: boolean
  client: Client | null
  interventions: Intervention[]
  devices: Device[]
  quotes: Quote[]
  invoices: Invoice[]
  messages: PortalMessage[]
  notifications: PortalNotification[]
  repairEvents: PortalRepairEvent[]
  lastSyncAt: string | null
  error: string | null
  refresh: (clientId: string) => Promise<void>
  loadFromCache: (clientId: string) => Promise<boolean>
}

export const usePortalDataStore = create<PortalDataStore>((set) => ({
  loading: false,
  offline: !navigator.onLine,
  fromCache: false,
  client: null,
  interventions: [],
  devices: [],
  quotes: [],
  invoices: [],
  messages: [],
  notifications: [],
  repairEvents: [],
  lastSyncAt: null,
  error: null,

  loadFromCache: async (clientId) => {
    const cached = await portalCacheService.load(clientId)
    if (!cached) return false
    set({
      client: cached.client,
      interventions: cached.interventions,
      devices: cached.devices,
      quotes: cached.quotes,
      invoices: cached.invoices,
      messages: cached.messages,
      notifications: cached.notifications,
      fromCache: true,
      offline: true,
    })
    return true
  },

  refresh: async (clientId) => {
    set({ loading: true, error: null, offline: !navigator.onLine })

    if (!navigator.onLine) {
      const ok = await usePortalDataStore.getState().loadFromCache(clientId)
      set({ loading: false, error: ok ? null : 'Hors ligne — aucune donnée en cache.' })
      return
    }

    try {
      const data = await portalApiService.fetchAll(clientId)
      set({
        client: data.client,
        interventions: data.interventions,
        devices: data.devices,
        quotes: data.quotes,
        invoices: data.invoices,
        messages: data.messages,
        notifications: data.notifications,
        repairEvents: data.repairEvents,
        fromCache: false,
        offline: false,
        lastSyncAt: new Date().toISOString(),
        loading: false,
      })

      if (data.client) {
        await portalCacheService.save({
          clientId,
          cachedAt: new Date().toISOString(),
          client: data.client,
          interventions: data.interventions,
          devices: data.devices,
          quotes: data.quotes,
          invoices: data.invoices,
          messages: data.messages,
          notifications: data.notifications,
        })
      }
    } catch (error) {
      const ok = await usePortalDataStore.getState().loadFromCache(clientId)
      set({
        loading: false,
        error:
          ok
            ? 'Mode hors ligne — données en cache.'
            : error instanceof Error
              ? error.message
              : 'Impossible de charger le portail.',
        offline: true,
      })
    }
  },
}))
