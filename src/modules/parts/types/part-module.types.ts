import type { SparePart, StockLevel } from '@/types/entities'
import type { PartCategory } from '@/modules/inventory/utils/part-categories'

export type PartSortField =
  | 'createdAt'
  | 'name'
  | 'reference'
  | 'quantity'
  | 'salePrice'
  | 'category'

export type SortDirection = 'asc' | 'desc'

export type PartCategoryFilter = PartCategory | 'all'
export type StockLevelFilter = StockLevel | 'all'

export type PartFilters = {
  search: string
  category: PartCategoryFilter
  stockLevel: StockLevelFilter
  sort: { field: PartSortField; direction: SortDirection }
  page: number
  pageSize: number
}

export const DEFAULT_PART_FILTERS: PartFilters = {
  search: '',
  category: 'all',
  stockLevel: 'all',
  page: 1,
  pageSize: 10,
  sort: { field: 'createdAt', direction: 'desc' },
}

export type PartFormValues = {
  name: string
  category: string
  reference: string
  supplier: string
  purchasePrice: string
  salePrice: string
  quantity: string
  minThreshold: string
  notes: string
}

export const EMPTY_PART_FORM: PartFormValues = {
  name: '',
  category: 'Autre',
  reference: '',
  supplier: '',
  purchasePrice: '0',
  salePrice: '0',
  quantity: '0',
  minThreshold: '2',
  notes: '',
}

export type PartTableRow = SparePart & {
  stockLevel: StockLevel
  marginAmount: number
  marginPercent: number
}
