import { Plus, Search } from 'lucide-react'
import type {
  QuoteFilters,
  QuoteSortField,
  QuoteStatusFilter,
} from '@/modules/quotes/types/quote-module.types'
import type { SortDirection } from '@/modules/commercial/types/commercial-module.types'
import { ALL_QUOTE_STATUSES, QUOTE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type QuotesToolbarProps = {
  filters: QuoteFilters
  total: number
  onSearchChange: (search: string) => void
  onStatusChange: (status: QuoteStatusFilter) => void
  onSortFieldChange: (field: QuoteSortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onCreateClick: () => void
}

const statusOptions = [
  { value: 'all' as const, label: 'Tous les statuts' },
  ...ALL_QUOTE_STATUSES.map((status) => ({
    value: status,
    label: QUOTE_STATUS_LABELS[status],
  })),
]

const sortFieldOptions = [
  { value: 'createdAt' as const, label: 'Date' },
  { value: 'number' as const, label: 'Numéro' },
  { value: 'client' as const, label: 'Client' },
  { value: 'total' as const, label: 'Montant' },
  { value: 'status' as const, label: 'Statut' },
]

const sortDirectionOptions = [
  { value: 'desc' as const, label: 'Décroissant' },
  { value: 'asc' as const, label: 'Croissant' },
]

export function QuotesToolbar({
  filters,
  total,
  onSearchChange,
  onStatusChange,
  onSortFieldChange,
  onSortDirectionChange,
  onCreateClick,
}: QuotesToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">Devis</h2>
        <p className="text-sm text-text-muted">
          {total} devis au total — workflow commercial intégré
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
            placeholder="N°, client, objet…"
            className="pl-9"
          />
        </div>

        <Select
          name="statusFilter"
          label="Statut"
          value={filters.status}
          onChange={(event) => onStatusChange(event.target.value as QuoteStatusFilter)}
          options={statusOptions}
          className="min-w-[150px]"
        />

        <Select
          name="sortField"
          label="Trier par"
          value={filters.sort.field}
          onChange={(event) => onSortFieldChange(event.target.value as QuoteSortField)}
          options={sortFieldOptions}
          className="min-w-[140px]"
        />

        <Select
          name="sortDirection"
          label="Ordre"
          value={filters.sort.direction}
          onChange={(event) => onSortDirectionChange(event.target.value as SortDirection)}
          options={sortDirectionOptions}
          className="min-w-[130px]"
        />

        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick} className="shrink-0">
          Nouveau devis
        </Button>
      </div>
    </div>
  )
}
