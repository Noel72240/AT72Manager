export type { Client, ClientInsert, ClientUpdate } from '@/types/entities/client.types'
export { clientsRepository } from '@/services/database/repositories/clients.repository'

export type {
  ClientFormValues,
  ClientSortField,
  SortDirection,
  ClientSort,
  ClientStatusFilter,
  ClientFilters,
  ClientTableRow,
} from '@/modules/clients/types/client-module.types'
export {
  DEFAULT_CLIENT_FILTERS,
  EMPTY_CLIENT_FORM,
} from '@/modules/clients/types/client-module.types'

export { getClientFullName, joinClientName, splitClientName } from '@/modules/clients/utils/client-name'
export { filterAndSortClients } from '@/modules/clients/utils/client-filters'

export { useClients } from '@/modules/clients/hooks/useClients'
export { ClientStatusBadge, STATUS_LABELS } from '@/modules/clients/components/ClientStatusBadge'
export { ClientFormModal } from '@/modules/clients/components/ClientFormModal'
export { ClientsToolbar } from '@/modules/clients/components/ClientsToolbar'
export { ClientsTable } from '@/modules/clients/components/ClientsTable'
export { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
export { ClientsEmptyState } from '@/modules/clients/components/ClientsEmptyState'
export { ClientsPage } from '@/modules/clients/pages/ClientsPage'
