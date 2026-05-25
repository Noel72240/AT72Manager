import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Quote } from '@/types/entities'
import type { DocumentPrefill } from '@/modules/commercial/types/commercial-module.types'
import {
  DEFAULT_QUOTE_FILTERS,
  type QuoteFilters,
  type QuoteFormValues,
  type QuoteTableRow,
} from '@/modules/quotes/types/quote-module.types'
import { useQuotes } from '@/modules/quotes/hooks/useQuotes'
import { useClients } from '@/modules/clients/hooks/useClients'
import { filterAndSortQuotes } from '@/modules/quotes/utils/quote-filters'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { computeDocumentTotals } from '@/modules/commercial/utils/document-totals'
import { useCommercialPdfExport } from '@/modules/commercial/hooks/useCommercialPdfExport'
import { QuoteFormModal } from '@/modules/quotes/components/QuoteFormModal'
import { QuotesToolbar } from '@/modules/quotes/components/QuotesToolbar'
import { QuotesTable } from '@/modules/quotes/components/QuotesTable'
import { QuotesEmptyState } from '@/modules/quotes/components/QuotesEmptyState'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

type QuotesLocationState = {
  prefill?: DocumentPrefill
}

function toTableRows(quotes: Quote[], clientNameById: Map<string, string>): QuoteTableRow[] {
  return quotes.map((quote) => ({
    ...quote,
    clientName: clientNameById.get(quote.clientId) ?? '—',
  }))
}

function formToPayload(values: QuoteFormValues) {
  const totals = computeDocumentTotals(values.lines)
  return {
    clientId: values.clientId,
    interventionId: values.interventionId || undefined,
    deviceId: values.deviceId || undefined,
    status: values.status,
    title: values.title.trim() || undefined,
    notes: values.notes.trim() || undefined,
    validUntil: values.validUntil || undefined,
    lines: values.lines,
    ...totals,
  }
}

export function QuotesPage() {
  const location = useLocation()
  const { clients } = useClients()
  const {
    quotes,
    loading,
    saving,
    createQuote,
    updateQuote,
    removeQuote,
    convertToInvoice,
  } = useQuotes()
  const { exportPdf, exportingId } = useCommercialPdfExport()

  const [filters, setFilters] = useState<QuoteFilters>(DEFAULT_QUOTE_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [prefill, setPrefill] = useState<DocumentPrefill | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<QuoteTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const clientNameById = useMemo(
    () => new Map(clients.map((client) => [client.id, getClientFullName(client)])),
    [clients],
  )

  useEffect(() => {
    const state = location.state as QuotesLocationState | null
    if (state?.prefill) {
      setPrefill(state.prefill)
      setEditingQuote(null)
      setFormOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortQuotes(quotes, filters, clientNameById),
    [quotes, filters, clientNameById],
  )

  const rows = useMemo(() => toTableRows(items, clientNameById), [items, clientNameById])
  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.status !== 'all'

  const updateFilters = (patch: Partial<QuoteFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleCreateClick = () => {
    setEditingQuote(null)
    setPrefill(null)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingQuote(null)
    setPrefill(null)
  }

  const handleFormSubmit = async (values: QuoteFormValues) => {
    const payload = formToPayload(values)
    if (editingQuote) {
      const updated = await updateQuote(editingQuote.id, payload)
      if (updated) handleFormClose()
      return
    }
    const created = await createQuote(payload)
    if (created) handleFormClose()
  }

  const handleExportPdf = (row: QuoteTableRow) => {
    const client = clients.find((item) => item.id === row.clientId)
    void exportPdf({ kind: 'quote', document: row, client })
  }

  const handleConvert = async (row: QuoteTableRow) => {
    setConvertingId(row.id)
    await convertToInvoice(row)
    setConvertingId(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const success = await removeQuote(deleteTarget.id)
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
          <QuotesToolbar
            filters={filters}
            total={quotes.length}
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
              <QuotesEmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={
                  hasActiveFilters
                    ? () => setFilters(DEFAULT_QUOTE_FILTERS)
                    : undefined
                }
              />
            ) : (
              <>
                <QuotesTable
                  rows={rows}
                  onEdit={(row) => {
                    setEditingQuote(row)
                    setPrefill(null)
                    setFormOpen(true)
                  }}
                  onDelete={setDeleteTarget}
                  onExportPdf={handleExportPdf}
                  onConvert={handleConvert}
                  deletingId={deletingId}
                  exportingId={exportingId}
                  convertingId={convertingId}
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

      <QuoteFormModal
        open={formOpen}
        quote={editingQuote}
        prefill={prefill}
        saving={saving}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le devis"
        description={
          deleteTarget
            ? `Supprimer le devis ${deleteTarget.number} ? Action irréversible.`
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
          Le devis sera retiré de votre carnet local et synchronisé avec le cloud.
        </p>
      </Modal>
    </>
  )
}
