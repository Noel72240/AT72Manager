/** Contrat commun pour futures intégrations calendrier (Outlook, Apple, push mobile). */
export type CalendarProviderId = 'google' | 'outlook' | 'apple' | 'mobile_push'

export type CalendarProviderCapabilities = {
  bidirectional: boolean
  nativeReminders: boolean
  offlineQueue: boolean
  conflictResolution: boolean
}

export const CALENDAR_PROVIDER_REGISTRY: Record<
  CalendarProviderId,
  { label: string; available: boolean; capabilities: CalendarProviderCapabilities }
> = {
  google: {
    label: 'Google Calendar',
    available: true,
    capabilities: {
      bidirectional: true,
      nativeReminders: true,
      offlineQueue: true,
      conflictResolution: true,
    },
  },
  outlook: {
    label: 'Outlook Calendar',
    available: false,
    capabilities: {
      bidirectional: true,
      nativeReminders: true,
      offlineQueue: true,
      conflictResolution: true,
    },
  },
  apple: {
    label: 'Apple Calendar',
    available: false,
    capabilities: {
      bidirectional: true,
      nativeReminders: true,
      offlineQueue: true,
      conflictResolution: true,
    },
  },
  mobile_push: {
    label: 'Notifications push (app technicien)',
    available: false,
    capabilities: {
      bidirectional: false,
      nativeReminders: true,
      offlineQueue: true,
      conflictResolution: false,
    },
  },
}
