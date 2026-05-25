import type { SparePart } from '@/types/entities'
import { getStockLevel } from '@/modules/inventory/utils/stock-level'
import type { PartFilters } from '@/modules/parts/types/part-module.types'

export function filterAndSortParts(parts: SparePart[], filters: PartFilters) {
  const query = filters.search.trim().toLowerCase()

  const filtered = parts.filter((part) => {
    if (filters.category !== 'all' && part.category !== filters.category) return false
    const level = getStockLevel(part)
    if (filters.stockLevel !== 'all' && level !== filters.stockLevel) return false
    if (!query) return true
    const haystack = [part.name, part.reference, part.supplier ?? '', part.category, part.notes ?? '']
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })

  const sorted = [...filtered].sort((a, b) => {
    let result = 0
    switch (filters.sort.field) {
      case 'name':
        result = a.name.localeCompare(b.name, 'fr')
        break
      case 'reference':
        result = a.reference.localeCompare(b.reference, 'fr')
        break
      case 'quantity':
        result = a.quantity - b.quantity
        break
      case 'salePrice':
        result = a.salePrice - b.salePrice
        break
      case 'category':
        result = a.category.localeCompare(b.category, 'fr')
        break
      case 'createdAt':
      default:
        result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return filters.sort.direction === 'asc' ? result : -result
  })

  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize))
  const page = Math.min(filters.page, totalPages)
  const start = (page - 1) * filters.pageSize
  return { items: sorted.slice(start, start + filters.pageSize), total, totalPages, page }
}
