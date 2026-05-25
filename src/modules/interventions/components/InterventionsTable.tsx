import { Camera, FileText, Pencil, Smartphone, Trash2, UserRound } from 'lucide-react'
import type { Client } from '@/types/entities'
import type { InterventionTableRow } from '@/modules/interventions/types/intervention-module.types'
import type { InterventionPdfKind } from '@/modules/interventions/field/types/field.types'
import { InterventionStatusBadge } from '@/modules/interventions/components/InterventionStatusBadge'
import { InterventionPdfMenu } from '@/modules/interventions/field/components/InterventionPdfMenu'
import { countMediaItems } from '@/modules/interventions/field/utils/media-utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type InterventionsTableProps = {
  rows: InterventionTableRow[]
  clientsById: Map<string, Client>
  onEdit: (row: InterventionTableRow) => void
  onDelete: (row: InterventionTableRow) => void
  onExportPdf: (row: InterventionTableRow, kind: InterventionPdfKind) => void
  onCreateQuote?: (row: InterventionTableRow) => void
  isExporting: (interventionId: string, kind?: InterventionPdfKind) => boolean
  deletingId?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatPrice(value?: number): string {
  if (value === undefined || value === null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}

export function InterventionsTable({
  rows,
  clientsById,
  onEdit,
  onDelete,
  onExportPdf,
  onCreateQuote,
  isExporting,
  deletingId,
}: InterventionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Appareil</th>
            <th className="px-4 py-3 font-medium">Panne signalée</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Prix</th>
            <th className="px-4 py-3 font-medium">Créé le</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const mediaCount = countMediaItems(row.media)
            const client = clientsById.get(row.clientId)

            return (
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
                    <Smartphone className="mt-0.5 size-4 shrink-0 text-text-muted" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-text-secondary">{row.deviceSummary}</p>
                      {row.imeiOrSerial ? (
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          IMEI / S/N : {row.imeiOrSerial}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="max-w-[220px] px-4 py-3.5">
                  <div className="flex items-start gap-2">
                    <p className="line-clamp-2 flex-1 text-text-secondary">{row.reportedIssue}</p>
                    {mediaCount > 0 ? (
                      <Badge variant="primary" className="shrink-0 gap-1">
                        <Camera className="size-3" />
                        {mediaCount}
                      </Badge>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <InterventionStatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3.5 text-text-secondary">
                  <p>{formatPrice(row.estimatedPrice)}</p>
                  {row.finalPrice !== undefined ? (
                    <p className="mt-0.5 text-xs text-text-muted">
                      Final : {formatPrice(row.finalPrice)}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3.5 text-text-secondary">{formatDate(row.createdAt)}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <InterventionPdfMenu
                      client={client}
                      isExporting={isExporting(row.id)}
                      onExport={(kind) => onExportPdf(row, kind)}
                    />
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
                      aria-label="Modifier l'intervention"
                      onClick={() => onEdit(row)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Supprimer l'intervention"
                      onClick={() => onDelete(row)}
                      loading={deletingId === row.id}
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
