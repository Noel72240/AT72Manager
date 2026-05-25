import type { Intervention, InterventionStatus } from '@/types/entities/intervention.types'
import type {
  InterventionFilters,
  InterventionSortField,
} from '@/modules/interventions/types/intervention-module.types'

function matchesSearch(intervention: Intervention, search: string, clientName?: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const haystack = [
    clientName ?? '',
    intervention.deviceLabel ?? '',
    intervention.brand ?? '',
    intervention.model ?? '',
    intervention.imeiOrSerial ?? '',
    intervention.reportedIssue,
    intervention.diagnostic ?? '',
    intervention.technicianNotes ?? '',
    intervention.status,
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function compareInterventions(
  a: Intervention,
  b: Intervention,
  field: InterventionSortField,
  clientNames: Map<string, string>,
): number {
  switch (field) {
    case 'client':
      return (clientNames.get(a.clientId) ?? '').localeCompare(clientNames.get(b.clientId) ?? '', 'fr')
    case 'status':
      return a.status.localeCompare(b.status, 'fr')
    case 'estimatedPrice':
      return (a.estimatedPrice ?? 0) - (b.estimatedPrice ?? 0)
    case 'createdAt':
    default:
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
}

export function filterAndSortInterventions(
  interventions: Intervention[],
  filters: InterventionFilters,
  clientNames: Map<string, string>,
) {
  const filtered = interventions.filter((item) => {
    if (filters.status !== 'all' && item.status !== filters.status) return false
    return matchesSearch(item, filters.search, clientNames.get(item.clientId))
  })

  const sorted = [...filtered].sort((a, b) => {
    const result = compareInterventions(a, b, filters.sort.field, clientNames)
    return filters.sort.direction === 'asc' ? result : -result
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  const items = sorted.slice(start, start + filters.pageSize)

  return { items, total, totalPages, page }
}

export type { InterventionStatus }
