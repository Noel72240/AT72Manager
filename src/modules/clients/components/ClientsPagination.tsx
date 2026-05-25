import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'

type ClientsPaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const pageSizeOptions = [
  { value: '10', label: '10 / page' },
  { value: '25', label: '25 / page' },
  { value: '50', label: '50 / page' },
]

export function ClientsPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: ClientsPaginationProps) {
  if (total === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-text-muted">
        Affichage {start}–{end} sur {total}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          name="pageSize"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          options={pageSizeOptions}
          className="min-w-[120px]"
          aria-label="Nombre d'éléments par page"
        />

        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[80px] text-center text-xs text-text-secondary">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
