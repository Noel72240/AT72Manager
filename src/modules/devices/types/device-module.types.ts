import type { Device, DeviceCondition } from '@/types/entities/device.types'
import { DEVICE_CATEGORIES } from '@/modules/interventions/utils/device-catalog'

export type DeviceFormValues = {
  clientId: string
  deviceType: string
  brand: string
  model: string
  customModel: string
  serialNumber: string
  imei: string
  storageCapacity: string
  color: string
  condition: DeviceCondition
  notes: string
}

export type DeviceSortField = 'createdAt' | 'client' | 'deviceType' | 'brand' | 'condition'
export type SortDirection = 'asc' | 'desc'

export type DeviceSort = {
  field: DeviceSortField
  direction: SortDirection
}

export type DeviceTypeFilter = (typeof DEVICE_CATEGORIES)[number] | 'all'
export type DeviceConditionFilter = DeviceCondition | 'all'

export type DeviceFilters = {
  search: string
  deviceType: DeviceTypeFilter
  condition: DeviceConditionFilter
  sort: DeviceSort
  page: number
  pageSize: number
}

export type DeviceTableRow = Device & {
  clientName: string
  summary: string
}

export const DEFAULT_DEVICE_FILTERS: DeviceFilters = {
  search: '',
  deviceType: 'all',
  condition: 'all',
  sort: { field: 'createdAt', direction: 'desc' },
  page: 1,
  pageSize: 10,
}

export const EMPTY_DEVICE_FORM: DeviceFormValues = {
  clientId: '',
  deviceType: '',
  brand: '',
  model: '',
  customModel: '',
  serialNumber: '',
  imei: '',
  storageCapacity: '',
  color: '',
  condition: 'good',
  notes: '',
}

export const FUTURE_DEVICE_FEATURES = {
  photos: 'Photos appareil (à venir)',
  serviceHistory: 'Historique SAV (à venir)',
  warranty: 'Garanties (à venir)',
  replacedParts: 'Pièces remplacées (à venir)',
  aiDiagnostic: 'Assistant diagnostic IA (à venir)',
} as const
