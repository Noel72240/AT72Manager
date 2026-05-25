import { Plus, Search } from 'lucide-react'
import type { PartFilters, PartSortField, PartCategoryFilter, StockLevelFilter } from '@/modules/parts/types/part-module.types'
import type { SortDirection } from '@/modules/parts/types/part-module.types'
import { PART_CATEGORIES } from '@/modules/inventory/utils/part-categories'
import { STOCK_LEVEL_LABELS } from '@/modules/inventory/utils/stock-level'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

type PartsToolbarProps = {
  filters: PartFilters
  total: number
  onSearchChange: (search: string) => void
  onCategoryChange: (category: PartCategoryFilter) => void
  onStockLevelChange: (level: StockLevelFilter) => void
  onSortFieldChange: (field: PartSortField) => void
  onSortDirectionChange: (direction: SortDirection) => void
  onCreateClick: () => void
}

export function PartsToolbar(props: PartsToolbarProps) {
  const {
    filters,
    total,
    onSearchChange,
    onCategoryChange,
    onStockLevelChange,
    onSortFieldChange,
    onSortDirectionChange,
    onCreateClick,
  } = props

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">Pièces détachées</h2>
        <p className="text-sm text-text-muted">{total} référence{total !== 1 ? 's' : ''} au catalogue</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:justify-end">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-[2.125rem] size-4 text-text-muted" />
          <Input
            name="search"
            label="Rechercher"
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Nom, réf., fournisseur…"
            className="pl-9"
          />
        </div>
        <Select
          name="category"
          label="Catégorie"
          value={filters.category}
          onChange={(e) => onCategoryChange(e.target.value as PartCategoryFilter)}
          options={[
            { value: 'all', label: 'Toutes' },
            ...PART_CATEGORIES.map((c) => ({ value: c, label: c })),
          ]}
          className="min-w-[140px]"
        />
        <Select
          name="stockLevel"
          label="Stock"
          value={filters.stockLevel}
          onChange={(e) => onStockLevelChange(e.target.value as StockLevelFilter)}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'ok', label: STOCK_LEVEL_LABELS.ok },
            { value: 'low', label: STOCK_LEVEL_LABELS.low },
            { value: 'out', label: STOCK_LEVEL_LABELS.out },
          ]}
          className="min-w-[130px]"
        />
        <Select
          name="sortField"
          label="Trier"
          value={filters.sort.field}
          onChange={(e) => onSortFieldChange(e.target.value as PartSortField)}
          options={[
            { value: 'createdAt', label: 'Date' },
            { value: 'name', label: 'Nom' },
            { value: 'reference', label: 'Référence' },
            { value: 'quantity', label: 'Quantité' },
            { value: 'salePrice', label: 'Prix vente' },
          ]}
          className="min-w-[130px]"
        />
        <Select
          name="sortDir"
          label="Ordre"
          value={filters.sort.direction}
          onChange={(e) => onSortDirectionChange(e.target.value as SortDirection)}
          options={[
            { value: 'desc', label: 'Décroissant' },
            { value: 'asc', label: 'Croissant' },
          ]}
          className="min-w-[120px]"
        />
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouvelle pièce
        </Button>
      </div>
    </div>
  )
}
