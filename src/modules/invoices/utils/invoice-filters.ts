import type { Invoice } from '@/types/entities'
import type { InvoiceFilters } from '@/modules/invoices/types/invoice-module.types'

export function filterAndSortInvoices(
  invoices: Invoice[],
  filters: InvoiceFilters,
  clientNameById: Map<string, string>,
) {
  const query = filters.search.trim().toLowerCase()

  const filtered = invoices.filter((invoice) => {
    if (filters.status !== 'all' && invoice.status !== filters.status) return false
    if (!query) return true

    const haystack = [
      invoice.number,
      invoice.title ?? '',
      invoice.notes ?? '',
      clientNameById.get(invoice.clientId) ?? '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })

  const sorted = [...filtered].sort((a, b) => {
    let result = 0
    switch (filters.sort.field) {
      case 'number':
        result = a.number.localeCompare(b.number, 'fr')
        break
      case 'total':
        result = a.total - b.total
        break
      case 'status':
        result = a.status.localeCompare(b.status, 'fr')
        break
      case 'client':
        result = (clientNameById.get(a.clientId) ?? '').localeCompare(
          clientNameById.get(b.clientId) ?? '',
          'fr',
        )
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
  const items = sorted.slice(start, start + filters.pageSize)

  return { items, total, totalPages, page }
}
