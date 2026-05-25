import type { CommercialLine } from '@/types/entities'

export type SortDirection = 'asc' | 'desc'

/** Préremplissage depuis client / intervention / appareil */
export type DocumentPrefill = {
  clientId?: string
  interventionId?: string
  deviceId?: string
  title?: string
  notes?: string
  lines?: CommercialLine[]
}
