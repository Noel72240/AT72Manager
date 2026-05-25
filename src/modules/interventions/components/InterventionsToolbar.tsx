import { Plus, Search } from 'lucide-react'
import type {
  InterventionFilters,
  InterventionSortField,
  InterventionStatusFilter,
  SortDirection,
} from '@/modules/interventions/types/intervention-module.types'
import { STATUS_LABELS } from '@/modules/interventions/components/InterventionStatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type InterventionsToolbarProps = {
  filters: InterventionFilters
  total: number
  onSearchChange: (search: string) => void
  onStatusChange: (status: InterventionStatusFilter) => void
  onSortFieldChange: (field: InterventionSortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onCreateClick: () => void
}

const statusFilterOptions = [
  { value: 'all' as const, label: 'Tous les statuts' },
  { value: 'diagnostic' as const, label: STATUS_LABELS.diagnostic },
  { value: 'in_progress' as const, label: STATUS_LABELS.in_progress },
  { value: 'waiting_parts' as const, label: STATUS_LABELS.waiting_parts },
  { value: 'completed' as const, label: STATUS_LABELS.completed },
  { value: 'returned' as const, label: STATUS_LABELS.returned },
]

const sortFieldOptions = [
  { value: 'createdAt' as const, label: 'Date de création' },
  { value: 'client' as const, label: 'Client' },
  { value: 'status' as const, label: 'Statut' },
  { value: 'estimatedPrice' as const, label: 'Prix estimé' },
]

const sortDirectionOptions = [
  { value: 'desc' as const, label: 'Décroissant' },
  { value: 'asc' as const, label: 'Croissant' },
]

export function InterventionsToolbar({
  filters,
  total,
  onSearchChange,
  onStatusChange,
  onSortFieldChange,
  onSortDirectionChange,
  onCreateClick,
}: InterventionsToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">Interventions SAV</h2>
        <p className="text-sm text-text-muted">
          {total} intervention{total !== 1 ? 's' : ''} au total
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
            placeholder="Client, appareil, IMEI, panne…"
            className="pl-9"
          />
        </div>

        <Select
          name="statusFilter"
          label="Statut"
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as InterventionStatusFilter)}
          options={statusFilterOptions}
          className="min-w-[160px]"
        />

        <Select
          name="sortField"
          label="Trier par"
          value={filters.sort.field}
          onChange={(event) => onSortFieldChange(event.target.value as InterventionSortField)}
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
          Nouvelle intervention
        </Button>
      </div>
    </div>
  )
}
