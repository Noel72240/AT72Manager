import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Invoice } from '@/types/entities'
import type { DocumentPrefill } from '@/modules/commercial/types/commercial-module.types'
import {
  DEFAULT_INVOICE_FILTERS,
  type InvoiceFilters,
  type InvoiceFormValues,
  type InvoiceTableRow,
} from '@/modules/invoices/types/invoice-module.types'
import { useInvoices } from '@/modules/invoices/hooks/useInvoices'
import { useClients } from '@/modules/clients/hooks/useClients'
import { filterAndSortInvoices } from '@/modules/invoices/utils/invoice-filters'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { computeDocumentTotals } from '@/modules/commercial/utils/document-totals'
import { useCommercialPdfExport } from '@/modules/commercial/hooks/useCommercialPdfExport'
import { InvoiceFormModal } from '@/modules/invoices/components/InvoiceFormModal'
import { InvoicesToolbar } from '@/modules/invoices/components/InvoicesToolbar'
import { InvoicesTable } from '@/modules/invoices/components/InvoicesTable'
import { InvoicesEmptyState } from '@/modules/invoices/components/InvoicesEmptyState'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

type InvoicesLocationState = {
  prefill?: DocumentPrefill
}

function toTableRows(invoices: Invoice[], clientNameById: Map<string, string>): InvoiceTableRow[] {
  return invoices.map((invoice) => ({
    ...invoice,
    clientName: clientNameById.get(invoice.clientId) ?? '—',
  }))
}

function formToPayload(values: InvoiceFormValues) {
  const totals = computeDocumentTotals(values.lines)
  return {
    clientId: values.clientId,
    interventionId: values.interventionId || undefined,
    deviceId: values.deviceId || undefined,
    quoteId: values.quoteId || undefined,
    status: values.status,
    title: values.title.trim() || undefined,
    notes: values.notes.trim() || undefined,
    dueDate: values.dueDate || undefined,
    lines: values.lines,
    ...totals,
  }
}

export function InvoicesPage() {
  const location = useLocation()
  const { clients } = useClients()
  const { invoices, loading, saving, createInvoice, updateInvoice, removeInvoice } =
    useInvoices()
  const { exportPdf, exportingId } = useCommercialPdfExport()

  const [filters, setFilters] = useState<InvoiceFilters>(DEFAULT_INVOICE_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [prefill, setPrefill] = useState<DocumentPrefill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InvoiceTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, getClientFullName(client)])),
    [clients],
  )

  useEffect(() => {
    const state = location.state as InvoicesLocationState | null
    if (state?.prefill) {
      setPrefill(state.prefill)
      setEditingInvoice(null)
      setFormOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortInvoices(invoices, filters, clientNameById),
    [invoices, filters, clientNameById],
  )

  const rows = useMemo(() => toTableRows(items, clientNameById), [items, clientNameById])
  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.status !== 'all'

  const updateFilters = (patch: Partial<InvoiceFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleCreateClick = () => {
    setEditingInvoice(null)
    setPrefill(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingInvoice(null)
    setPrefill(null)
  }

  const handleFormSubmit = async (values: InvoiceFormValues) => {
    const payload = formToPayload(values)
    if (editingInvoice) {
      const updated = await updateInvoice(editingInvoice.id, payload)
      if (updated) handleFormClose()
      return
    }
    const created = await createInvoice(payload)
    if (created) handleFormClose()
  }

  const handleExportPdf = (row: InvoiceTableRow) => {
    const client = clients.find((item) => item.id === row.clientId)
    void exportPdf({ kind: 'invoice', document: row, client })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const success = await removeInvoice(deleteTarget.id)
    setDeletingId(null)
    if (success) setDeleteTarget(null)
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
          <InvoicesToolbar
            filters={filters}
            total={invoices.length}
            onSearchChange={(search) => updateFilters({ search })}
            onStatusChange={(status) => updateFilters({ status })}
            onSortFieldChange={(field) =>
              updateFilters({ sort: { ...filters.sort, field } })
            }
            onSortDirectionChange={(direction) =>
              updateFilters({ sort: { ...filters.sort, direction } })
            }
            onCreateClick={handleCreateClick}
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden p-0">
            {loading ? (
              <TableSkeleton rows={6} />
            ) : rows.length === 0 ? (
              <InvoicesEmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={
                  hasActiveFilters
                    ? () => setFilters(DEFAULT_INVOICE_FILTERS)
                    : undefined
                }
              />
            ) : (
              <>
                <InvoicesTable
                  rows={rows}
                  onEdit={(row) => {
                    setEditingInvoice(row)
                    setPrefill(null)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                  onExportPdf={handleExportPdf}
                  deletingId={deletingId}
                  exportingId={exportingId}
                />
                <ClientsPagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  pageSize={filters.pageSize}
                  onPageChange={(nextPage) => updateFilters({ page: nextPage })}
                  onPageSizeChange={(pageSize) => updateFilters({ pageSize, page: 1 })}
                />
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <InvoiceFormModal
        open={formOpen}
        invoice={editingInvoice}
        prefill={prefill}
        saving={saving}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la facture"
        description={
          deleteTarget
            ? `Supprimer la facture ${deleteTarget.number} ? Action irréversible.`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>
              Annuler
            </Button>
            <Button variant="danger" loading={Boolean(deletingId)} onClick={() => void handleDeleteConfirm()}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          La facture sera retirée de votre carnet local et synchronisée avec le cloud.
        </p>
      </Modal>
    </>
  )
}
