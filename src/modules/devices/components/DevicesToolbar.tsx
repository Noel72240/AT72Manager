import { Plus, Search } from 'lucide-react'
import type {
  DeviceConditionFilter,
  DeviceFilters,
  DeviceSortField,
  DeviceTypeFilter,
  SortDirection,
} from '@/modules/devices/types/device-module.types'
import { CONDITION_LABELS } from '@/modules/devices/components/DeviceConditionBadge'
import { ALL_CONDITIONS } from '@/modules/devices/utils/device-labels'
import { DEVICE_CATEGORIES } from '@/modules/interventions/utils/device-catalog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type DevicesToolbarProps = {
  filters: DeviceFilters
  total: number
  onSearchChange: (search: string) => void
  onDeviceTypeChange: (deviceType: DeviceTypeFilter) => void
  onConditionChange: (condition: DeviceConditionFilter) => void
  onSortFieldChange: (field: DeviceSortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onCreateClick: () => void
}

const typeFilterOptions = [
  { value: 'all' as const, label: 'Tous les types' },
  ...DEVICE_CATEGORIES.map((type) => ({ value: type, label: type })),
]

const conditionFilterOptions = [
  { value: 'all' as const, label: 'Tous les états' },
  ...ALL_CONDITIONS.map((condition) => ({
    value: condition,
    label: CONDITION_LABELS[condition],
  })),
]

const sortFieldOptions = [
  { value: 'createdAt' as const, label: 'Date de création' },
  { value: 'client' as const, label: 'Client' },
  { value: 'deviceType' as const, label: 'Type' },
  { value: 'brand' as const, label: 'Marque' },
  { value: 'condition' as const, label: 'État' },
]

const sortDirectionOptions = [
  { value: 'desc' as const, label: 'Décroissant' },
  { value: 'asc' as const, label: 'Croissant' },
]

export function DevicesToolbar({
  filters,
  total,
  onSearchChange,
  onDeviceTypeChange,
  onConditionChange,
  onSortFieldChange,
  onSortDirectionChange,
  onCreateClick,
}: DevicesToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">Appareils</h2>
        <p className="text-sm text-text-muted">
          {total} appareil{total !== 1 ? 's' : ''} au total
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
            placeholder="Client, marque, IMEI, S/N…"
            className="pl-9"
          />
        </div>

        <Select
          name="deviceTypeFilter"
          label="Type"
          value={filters.deviceType}
          onChange={(event) => onDeviceTypeChange(event.target.value as DeviceTypeFilter)}
          options={typeFilterOptions}
          className="min-w-[150px]"
        />

        <Select
          name="conditionFilter"
          label="État"
          value={filters.condition}
          onChange={(event) => onConditionChange(event.target.value as DeviceConditionFilter)}
          options={conditionFilterOptions}
          className="min-w-[150px]"
        />

        <Select
          name="sortField"
          label="Trier par"
          value={filters.sort.field}
          onChange={(event) => onSortFieldChange(event.target.value as DeviceSortField)}
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
          Nouvel appareil
        </Button>
      </div>
    </div>
  )
}
