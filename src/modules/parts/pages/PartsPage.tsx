import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { SparePart } from '@/types/entities'
import {
  DEFAULT_PART_FILTERS,
  type PartFilters,
  type PartFormValues,
  type PartTableRow,
} from '@/modules/parts/types/part-module.types'
import { useSpareParts } from '@/modules/parts/hooks/useSpareParts'
import { filterAndSortParts } from '@/modules/parts/utils/part-filters'
import { getStockLevel } from '@/modules/inventory/utils/stock-level'
import { computePartMargin } from '@/modules/inventory/utils/margin'
import { PartFormModal } from '@/modules/parts/components/PartFormModal'
import { PartsToolbar } from '@/modules/parts/components/PartsToolbar'
import { PartsTable } from '@/modules/parts/components/PartsTable'
import { PartsEmptyState } from '@/modules/parts/components/PartsEmptyState'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

function toRows(items: SparePart[]): PartTableRow[] {
  return items.map((part) => {
    const { marginAmount, marginPercent } = computePartMargin(part.purchasePrice, part.salePrice)
    return { ...part, stockLevel: getStockLevel(part), marginAmount, marginPercent }
  })
}

function formToPayload(values: PartFormValues) {
  return {
    name: values.name.trim(),
    category: values.category,
    reference: values.reference.trim(),
    supplier: values.supplier.trim() || undefined,
    purchasePrice: Number(values.purchasePrice) || 0,
    salePrice: Number(values.salePrice) || 0,
    quantity: Math.max(0, Math.round(Number(values.quantity) || 0)),
    minThreshold: Math.max(0, Math.round(Number(values.minThreshold) || 0)),
    notes: values.notes.trim() || undefined,
  }
}

export function PartsPage() {
  const { parts, loading, saving, createPart, updatePart, removePart } = useSpareParts()
  const [filters, setFilters] = useState<PartFilters>(DEFAULT_PART_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<SparePart | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PartTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortParts(parts, filters),
    [parts, filters],
  )
  const rows = useMemo(() => toRows(items), [items])
  const hasFilters =
    filters.search.trim().length > 0 ||
    filters.category !== 'all' ||
    filters.stockLevel !== 'all'

  const updateFilters = (patch: Partial<PartFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleSubmit = async (values: PartFormValues) => {
    const payload = formToPayload(values)
    if (editing) {
      const updated = await updatePart(editing.id, payload)
      if (updated) {
        setFormOpen(false)
        setEditing(null)
      }
      return
    }
    const created = await createPart(payload)
    if (created) {
      setFormOpen(false)
    }
  }

  return (
    <>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8"
      >
        <motion.div variants={fadeInUp}>
          <PartsToolbar
            filters={filters}
            total={parts.length}
            onSearchChange={(search) => updateFilters({ search })}
            onCategoryChange={(category) => updateFilters({ category })}
            onStockLevelChange={(stockLevel) => updateFilters({ stockLevel })}
            onSortFieldChange={(field) => updateFilters({ sort: { ...filters.sort, field } })}
            onSortDirectionChange={(direction) =>
              updateFilters({ sort: { ...filters.sort, direction } })
            }
            onCreateClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          />
        </motion.div>
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden p-0">
            {loading ? (
              <TableSkeleton rows={6} />
            ) : rows.length === 0 ? (
              <PartsEmptyState
                hasFilters={hasFilters}
                onCreateClick={() => setFormOpen(true)}
                onClearFilters={
                  hasFilters ? () => setFilters(DEFAULT_PART_FILTERS) : undefined
                }
              />
            ) : (
              <>
                <PartsTable
                  rows={rows}
                  onEdit={(row) => {
                    setEditing(row)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                  deletingId={deletingId}
                />
                <ClientsPagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  pageSize={filters.pageSize}
                  onPageChange={(p) => updateFilters({ page: p })}
                  onPageSizeChange={(pageSize) => updateFilters({ pageSize, page: 1 })}
                />
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <PartFormModal
        open={formOpen}
        part={editing}
        saving={saving}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la pièce"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={Boolean(deletingId)}
              onClick={async () => {
                if (!deleteTarget) return
                setDeletingId(deleteTarget.id)
                const ok = await removePart(deleteTarget.id)
                setDeletingId(null)
                if (ok) setDeleteTarget(null)
              }}
            >
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Supprimer {deleteTarget?.name} ? L&apos;historique des mouvements liés peut être perdu.
        </p>
      </Modal>
    </>
  )
}
