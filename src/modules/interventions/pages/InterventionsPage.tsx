import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/config/routes'
import { prefillFromIntervention } from '@/modules/commercial/utils/document-prefill'
import type { Intervention } from '@/types/entities'
import type { InterventionFormValues } from '@/modules/interventions/types/intervention-module.types'
import {
  DEFAULT_INTERVENTION_FILTERS,
  type InterventionFilters,
  type InterventionTableRow,
} from '@/modules/interventions/types/intervention-module.types'
import { useInterventions } from '@/modules/interventions/hooks/useInterventions'
import { useClients } from '@/modules/clients/hooks/useClients'
import { filterAndSortInterventions } from '@/modules/interventions/utils/intervention-filters'
import { getDeviceSummary } from '@/modules/interventions/utils/intervention-labels'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { normalizeInterventionMedia } from '@/modules/interventions/field/utils/media-utils'
import { InterventionFormModal, parseOptionalPrice, resolveStoredModel } from '@/modules/interventions/components/InterventionFormModal'
import { useInterventionPdfExport } from '@/modules/interventions/field/hooks/useInterventionPdfExport'
import { InterventionsToolbar } from '@/modules/interventions/components/InterventionsToolbar'
import { InterventionsTable } from '@/modules/interventions/components/InterventionsTable'
import { InterventionsEmptyState } from '@/modules/interventions/components/InterventionsEmptyState'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

function formValuesToPayload(values: InterventionFormValues) {
  return {
    clientId: values.clientId,
    deviceLabel: values.deviceLabel.trim() || undefined,
    brand: values.brand.trim() || undefined,
    model: resolveStoredModel(values.model, values.customModel) || undefined,
    imeiOrSerial: values.imeiOrSerial.trim() || undefined,
    reportedIssue: values.reportedIssue.trim(),
    diagnostic: values.diagnostic.trim() || undefined,
    technicianNotes: values.technicianNotes.trim() || undefined,
    status: values.status,
    estimatedPrice: parseOptionalPrice(values.estimatedPrice),
    finalPrice: parseOptionalPrice(values.finalPrice),
    media: normalizeInterventionMedia(values.media),
    partsLines: values.partsLines.filter((line) => line.description.trim() || line.partId),
  }
}

export function InterventionsPage() {
  const navigate = useNavigate()
  const { interventions, loading, saving, createIntervention, updateIntervention, removeIntervention } =
    useInterventions()
  const { clients } = useClients()
  const { exportPdf, isExporting } = useInterventionPdfExport()

  const clientsById = useMemo(() => {
    const map = new Map<string, (typeof clients)[number]>()
    for (const client of clients) {
      map.set(client.id, client)
    }
    return map
  }, [clients])

  const [filters, setFilters] = useState<InterventionFilters>(DEFAULT_INTERVENTION_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<InterventionTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const clientNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      map.set(client.id, getClientFullName(client))
    }
    return map
  }, [clients])

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortInterventions(interventions, filters, clientNames),
    [interventions, filters, clientNames],
  )

  const rows: InterventionTableRow[] = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        clientName: clientNames.get(item.clientId) ?? 'Client inconnu',
        deviceSummary: getDeviceSummary(item),
      })),
    [items, clientNames],
  )

  const hasActiveFilters = filters.search.trim().length > 0 || filters.status !== 'all'

  const updateFilters = (patch: Partial<InterventionFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleCreateClick = () => {
    setEditingIntervention(null)
    setFormOpen(true)
  }

  const handleEdit = (row: InterventionTableRow) => {
    setEditingIntervention(row)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingIntervention(null)
  }

  const handleFormSubmit = async (values: InterventionFormValues) => {
    const payload = formValuesToPayload(values)

    if (editingIntervention) {
      const updated = await updateIntervention(editingIntervention.id, payload)
      if (updated) handleFormClose()
      return
    }

    const created = await createIntervention(payload)
    if (created) handleFormClose()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const success = await removeIntervention(deleteTarget.id)
    setDeletingId(null)
    if (success) {
      setDeleteTarget(null)
      setFilters((prev) => ({ ...prev, page: 1 }))
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
          <InterventionsToolbar
            filters={filters}
            total={interventions.length}
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
              <InterventionsEmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={
                  hasActiveFilters
                    ? () => setFilters(DEFAULT_INTERVENTION_FILTERS)
                    : undefined
                }
              />
            ) : (
              <>
                <InterventionsTable
                  rows={rows}
                  clientsById={clientsById}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onExportPdf={(row, kind) =>
                    void exportPdf(row, clientsById.get(row.clientId), kind)
                  }
                  onCreateQuote={(row) =>
                    navigate(ROUTES.QUOTES, {
                      state: { prefill: prefillFromIntervention(row) },
                    })
                  }
                  isExporting={isExporting}
                  deletingId={deletingId}
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

      <InterventionFormModal
        open={formOpen}
        intervention={editingIntervention}
        clients={clients}
        saving={saving}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'intervention"
        description={
          deleteTarget
            ? `Voulez-vous vraiment supprimer l'intervention « ${deleteTarget.reportedIssue} » ?`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>
              Annuler
            </Button>
            <Button variant="danger" loading={Boolean(deletingId)} onClick={handleDeleteConfirm}>
              Supprimer
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-secondary">
          Cette action est irréversible. La fiche sera supprimée localement et synchronisée avec le cloud.
        </p>
      </Modal>
    </>
  )
}
