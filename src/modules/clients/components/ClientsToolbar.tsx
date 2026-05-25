import { Plus, Search } from 'lucide-react'
import type { ClientFilters, ClientSortField, SortDirection } from '@/modules/clients/types/client-module.types'
import type { ClientStatusFilter } from '@/modules/clients/types/client-module.types'
import { STATUS_LABELS } from '@/modules/clients/components/ClientStatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type ClientsToolbarProps = {
  filters: ClientFilters
  total: number
  onSearchChange: (search: string) => void
  onStatusChange: (status: ClientStatusFilter) => void
  onSortFieldChange: (field: ClientSortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onCreateClick: () => void
}

const statusFilterOptions = [
  { value: 'all' as const, label: 'Tous les statuts' },
  { value: 'active' as const, label: STATUS_LABELS.active },
  { value: 'inactive' as const, label: STATUS_LABELS.inactive },
  { value: 'prospect' as const, label: STATUS_LABELS.prospect },
]

const sortFieldOptions = [
  { value: 'createdAt' as const, label: 'Date de création' },
  { value: 'name' as const, label: 'Nom' },
  { value: 'status' as const, label: 'Statut' },
]

const sortDirectionOptions = [
  { value: 'desc' as const, label: 'Décroissant' },
  { value: 'asc' as const, label: 'Croissant' },
]

export function ClientsToolbar({
  filters,
  total,
  onSearchChange,
  onStatusChange,
  onSortFieldChange,
  onSortDirectionChange,
  onCreateClick,
}: ClientsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">Clients</h2>
        <p className="text-sm text-text-muted">
          {total} client{total !== 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-[2.125rem] size-4 text-text-muted" />
          <Input
            name="search"
            label="Rechercher"
            value={filters.search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Nom, e-mail, téléphone…"
            className="pl-9"
          />
        </div>

        <Select
          name="statusFilter"
          label="Statut"
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as ClientStatusFilter)}
          options={statusFilterOptions}
          className="min-w-[160px]"
        />

        <Select
          name="sortField"
          label="Trier par"
          value={filters.sort.field}
          onChange={(event) => onSortFieldChange(event.target.value as ClientSortField)}
          options={sortFieldOptions}
          className="min-w-[160px]"
        />

        <Select
          name="sortDirection"
          label="Ordre"
          value={filters.sort.direction}
          onChange={(event) => onSortDirectionChange(event.target.value as SortDirection)}
          options={sortDirectionOptions}
          className="min-w-[140px]"
        />

        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick} className="shrink-0">
          Nouveau client
        </Button>
      </div>
    </div>
  )
}
