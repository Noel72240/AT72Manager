import type { Device, DeviceCondition } from '@/types/entities/device.types'
import type { DeviceFilters, DeviceSortField } from '@/modules/devices/types/device-module.types'

function matchesSearch(device: Device, search: string, clientName?: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const haystack = [
    clientName ?? '',
    device.deviceType,
    device.brand ?? '',
    device.model ?? '',
    device.serialNumber ?? '',
    device.imei ?? '',
    device.storageCapacity ?? '',
    device.color ?? '',
    device.notes ?? '',
    device.condition,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function compareDevices(
  a: Device,
  b: Device,
  field: DeviceSortField,
  clientNames: Map<string, string>,
): number {
  switch (field) {
    case 'client':
      return (clientNames.get(a.clientId) ?? '').localeCompare(clientNames.get(b.clientId) ?? '', 'fr')
    case 'deviceType':
      return a.deviceType.localeCompare(b.deviceType, 'fr')
    case 'brand':
      return (a.brand ?? '').localeCompare(b.brand ?? '', 'fr')
    case 'condition':
      return a.condition.localeCompare(b.condition, 'fr')
    case 'createdAt':
    default:
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
}

export function filterAndSortDevices(
  devices: Device[],
  filters: DeviceFilters,
  clientNames: Map<string, string>,
) {
  const filtered = devices.filter((item) => {
    if (filters.deviceType !== 'all' && item.deviceType !== filters.deviceType) return false
    if (filters.condition !== 'all' && item.condition !== filters.condition) return false
    return matchesSearch(item, filters.search, clientNames.get(item.clientId))
  })

  const sorted = [...filtered].sort((a, b) => {
    const result = compareDevices(a, b, filters.sort.field, clientNames)
    return filters.sort.direction === 'asc' ? result : -result
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  const items = sorted.slice(start, start + filters.pageSize)

  return { items, total, totalPages, page }
}

export type { DeviceCondition }
