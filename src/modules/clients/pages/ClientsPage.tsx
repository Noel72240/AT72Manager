import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/config/routes'
import { prefillFromClient } from '@/modules/commercial/utils/document-prefill'
import type { Client } from '@/types/entities'
import type { ClientFormValues } from '@/modules/clients/types/client-module.types'
import {
  DEFAULT_CLIENT_FILTERS,
  type ClientFilters,
  type ClientTableRow,
} from '@/modules/clients/types/client-module.types'
import { useClients } from '@/modules/clients/hooks/useClients'
import { filterAndSortClients } from '@/modules/clients/utils/client-filters'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { ClientFormModal } from '@/modules/clients/components/ClientFormModal'
import { ClientsToolbar } from '@/modules/clients/components/ClientsToolbar'
import { ClientsTable } from '@/modules/clients/components/ClientsTable'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { ClientsEmptyState } from '@/modules/clients/components/ClientsEmptyState'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

function toTableRows(clients: Client[]): ClientTableRow[] {
  return clients.map((client) => ({
    ...client,
    fullName: getClientFullName(client),
  }))
}

function formValuesToPayload(values: ClientFormValues) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    address: values.address.trim() || undefined,
    notes: values.notes.trim() || undefined,
    status: values.status,
  }
}

export function ClientsPage() {
  const navigate = useNavigate()
  const { clients, loading, saving, createClient, updateClient, removeClient } = useClients()

  const [filters, setFilters] = useState<ClientFilters>(DEFAULT_CLIENT_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClientTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortClients(clients, filters),
    [clients, filters],
  )

  const rows = useMemo(() => toTableRows(items), [items])
  const hasActiveFilters =
    filters.search.trim().length > 0 || filters.status !== 'all'

  const updateFilters = (patch: Partial<ClientFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleCreateClick = () => {
    setEditingClient(null)
    setFormOpen(true)
  }

  const handleEdit = (client: ClientTableRow) => {
    setEditingClient(client)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingClient(null)
  }

  const handleFormSubmit = async (values: ClientFormValues) => {
    const payload = formValuesToPayload(values)

    if (editingClient) {
      const updated = await updateClient(editingClient.id, payload)
      if (updated) handleFormClose()
      return
    }

    const created = await createClient(payload)
    if (created) handleFormClose()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const success = await removeClient(deleteTarget.id)
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
          <ClientsToolbar
            filters={filters}
            total={clients.length}
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
              <ClientsEmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={
                  hasActiveFilters
                    ? () => setFilters(DEFAULT_CLIENT_FILTERS)
                    : undefined
                }
              />
            ) : (
              <>
                <ClientsTable
                  rows={rows}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onCreateQuote={(row) =>
                    navigate(ROUTES.QUOTES, {
                      state: { prefill: prefillFromClient(row.id) },
                    })
                  }
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

      <ClientFormModal
        open={formOpen}
        client={editingClient}
        saving={saving}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le client"
        description={
          deleteTarget
            ? `Voulez-vous vraiment supprimer ${deleteTarget.fullName} ? Cette action est irréversible.`
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
          Toutes les données associées à ce client seront définitivement supprimées de votre
          carnet local.
        </p>
      </Modal>
    </>
  )
}
