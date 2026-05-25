import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ROUTES } from '@/config/routes'
import { prefillFromDevice } from '@/modules/commercial/utils/document-prefill'
import type { Device } from '@/types/entities'
import type { DeviceFormValues } from '@/modules/devices/types/device-module.types'
import {
  DEFAULT_DEVICE_FILTERS,
  type DeviceFilters,
  type DeviceTableRow,
} from '@/modules/devices/types/device-module.types'
import { useDevices } from '@/modules/devices/hooks/useDevices'
import { useClients } from '@/modules/clients/hooks/useClients'
import { filterAndSortDevices } from '@/modules/devices/utils/device-filters'
import { getDeviceSummary } from '@/modules/devices/utils/device-labels'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { DeviceFormModal, resolveStoredModel } from '@/modules/devices/components/DeviceFormModal'
import { DevicesToolbar } from '@/modules/devices/components/DevicesToolbar'
import { DevicesTable } from '@/modules/devices/components/DevicesTable'
import { DevicesEmptyState } from '@/modules/devices/components/DevicesEmptyState'
import { ClientsPagination } from '@/modules/clients/components/ClientsPagination'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { fadeInUp, staggerContainer } from '@/utils/motion'

function formValuesToPayload(values: DeviceFormValues) {
  return {
    clientId: values.clientId,
    deviceType: values.deviceType,
    brand: values.brand.trim() || undefined,
    model: resolveStoredModel(values.model, values.customModel) || undefined,
    serialNumber: values.serialNumber.trim() || undefined,
    imei: values.imei.trim() || undefined,
    storageCapacity: values.storageCapacity || undefined,
    color: values.color || undefined,
    condition: values.condition,
    notes: values.notes.trim() || undefined,
  }
}

export function DevicesPage() {
  const navigate = useNavigate()
  const { devices, loading, saving, createDevice, updateDevice, removeDevice } = useDevices()
  const { clients } = useClients()

  const [filters, setFilters] = useState<DeviceFilters>(DEFAULT_DEVICE_FILTERS)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeviceTableRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const clientNames = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clients) {
      map.set(client.id, getClientFullName(client))
    }
    return map
  }, [clients])

  const { items, total, totalPages, page } = useMemo(
    () => filterAndSortDevices(devices, filters, clientNames),
    [devices, filters, clientNames],
  )

  const rows: DeviceTableRow[] = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        clientName: clientNames.get(item.clientId) ?? 'Client inconnu',
        summary: getDeviceSummary(item),
      })),
    [items, clientNames],
  )

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.deviceType !== 'all' ||
    filters.condition !== 'all'

  const updateFilters = (patch: Partial<DeviceFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }))
  }

  const handleCreateClick = () => {
    setEditingDevice(null)
    setFormOpen(true)
  }

  const handleEdit = (row: DeviceTableRow) => {
    setEditingDevice(row)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingDevice(null)
  }

  const handleFormSubmit = async (values: DeviceFormValues) => {
    const payload = formValuesToPayload(values)

    if (editingDevice) {
      const updated = await updateDevice(editingDevice.id, payload)
      if (updated) handleFormClose()
      return
    }

    const created = await createDevice(payload)
    if (created) handleFormClose()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingId(deleteTarget.id)
    const success = await removeDevice(deleteTarget.id)
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
          <DevicesToolbar
            filters={filters}
            total={devices.length}
            onSearchChange={(search) => updateFilters({ search })}
            onDeviceTypeChange={(deviceType) => updateFilters({ deviceType })}
            onConditionChange={(condition) => updateFilters({ condition })}
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
              <DevicesEmptyState
                hasFilters={hasActiveFilters}
                onCreateClick={handleCreateClick}
                onClearFilters={
                  hasActiveFilters ? () => setFilters(DEFAULT_DEVICE_FILTERS) : undefined
                }
              />
            ) : (
              <>
                <DevicesTable
                  rows={rows}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  onCreateQuote={(row) =>
                    navigate(ROUTES.QUOTES, {
                      state: { prefill: prefillFromDevice(row) },
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

      <DeviceFormModal
        open={formOpen}
        device={editingDevice}
        clients={clients}
        saving={saving}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer l'appareil"
        description={
          deleteTarget
            ? `Voulez-vous vraiment supprimer « ${deleteTarget.summary} » ?`
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
          Cette action est irréversible. L'appareil sera supprimé localement et synchronisé avec le cloud.
        </p>
      </Modal>
    </>
  )
}
