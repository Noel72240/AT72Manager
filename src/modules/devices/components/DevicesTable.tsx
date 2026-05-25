import { Cpu, FileText, Pencil, Trash2, UserRound } from 'lucide-react'
import type { DeviceTableRow } from '@/modules/devices/types/device-module.types'
import { DeviceTypeBadge } from '@/modules/devices/components/DeviceTypeBadge'
import { DeviceConditionBadge } from '@/modules/devices/components/DeviceConditionBadge'
import { Button } from '@/components/ui/Button'

type DevicesTableProps = {
  rows: DeviceTableRow[]
  onEdit: (row: DeviceTableRow) => void
  onDelete: (row: DeviceTableRow) => void
  onCreateQuote?: (row: DeviceTableRow) => void
  deletingId?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function DevicesTable({
  rows,
  onEdit,
  onDelete,
  onCreateQuote,
  deletingId,
}: DevicesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Appareil</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Identifiants</th>
            <th className="px-4 py-3 font-medium">État</th>
            <th className="px-4 py-3 font-medium">Créé le</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/50 transition-colors hover:bg-surface-hover/40"
            >
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-muted ring-1 ring-neon-blue/20">
                    <UserRound className="size-4 text-neon-blue" />
                  </div>
                  <p className="truncate font-medium text-text-primary">{row.clientName}</p>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-start gap-2">
                  <Cpu className="mt-0.5 size-4 shrink-0 text-text-muted" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-secondary">{row.summary}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {[row.storageCapacity, row.color].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <DeviceTypeBadge deviceType={row.deviceType} />
              </td>
              <td className="px-4 py-3.5 text-text-secondary">
                {row.imei ? (
                  <p className="truncate text-xs">IMEI : {row.imei}</p>
                ) : null}
                {row.serialNumber ? (
                  <p className="mt-0.5 truncate text-xs">S/N : {row.serialNumber}</p>
                ) : null}
                {!row.imei && !row.serialNumber ? (
                  <span className="text-xs text-text-muted">—</span>
                ) : null}
              </td>
              <td className="px-4 py-3.5">
                <DeviceConditionBadge condition={row.condition} />
              </td>
              <td className="px-4 py-3.5 text-text-secondary">{formatDate(row.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  {onCreateQuote ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Créer un devis"
                      title="Créer un devis"
                      onClick={() => onCreateQuote(row)}
                    >
                      <FileText className="size-4 text-neon-blue" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Modifier l'appareil"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Supprimer l'appareil"
                    onClick={() => onDelete(row)}
                    loading={deletingId === row.id}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
