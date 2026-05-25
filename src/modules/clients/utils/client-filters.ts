import type { Client } from '@/types/entities/client.types'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import type { ClientFilters } from '@/modules/clients/types/client-module.types'

function matchesSearch(client: Client, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const haystack = [
    client.firstName,
    client.lastName,
    getClientFullName(client),
    client.email ?? '',
    client.phone ?? '',
    client.address ?? '',
    client.notes ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(query)
}

function compareClients(a: Client, b: Client, field: ClientFilters['sort']['field']): number {
  switch (field) {
    case 'name':
      return getClientFullName(a).localeCompare(getClientFullName(b), 'fr')
    case 'status':
      return a.status.localeCompare(b.status, 'fr')
    case 'createdAt':
    default:
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  }
}

export function filterAndSortClients(clients: Client[], filters: ClientFilters) {
  const filtered = clients.filter((client) => {
    if (filters.status !== 'all' && client.status !== filters.status) return false
    return matchesSearch(client, filters.search)
  })

  const sorted = [...filtered].sort((a, b) => {
    const result = compareClients(a, b, filters.sort.field)
    return filters.sort.direction === 'asc' ? result : -result
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  const items = sorted.slice(start, start + filters.pageSize)

  return { items, total, totalPages, page }
}
