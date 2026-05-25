import { FileDown, Pencil, Receipt, Trash2 } from 'lucide-react'
import type { InvoiceTableRow } from '@/modules/invoices/types/invoice-module.types'
import { InvoiceStatusBadge } from '@/modules/invoices/components/InvoiceStatusBadge'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'

type InvoicesTableProps = {
  rows: InvoiceTableRow[]
  onEdit: (row: InvoiceTableRow) => void
  onDelete: (row: InvoiceTableRow) => void
  onExportPdf: (row: InvoiceTableRow) => void
  deletingId?: string | null
  exportingId?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function InvoicesTable({
  rows,
  onEdit,
  onDelete,
  onExportPdf,
  deletingId,
  exportingId,
}: InvoicesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-medium">N°</th>
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Objet</th>
            <th className="px-4 py-3 font-medium">Montant</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Échéance</th>
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
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-neon-green" />
                  <span className="font-mono text-xs font-medium text-text-primary">
                    {row.number}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 font-medium text-text-primary">{row.clientName}</td>
              <td className="max-w-[200px] px-4 py-3.5 truncate text-text-secondary">
                {row.title || '—'}
              </td>
              <td className="px-4 py-3.5 font-semibold text-neon-green">
                {formatPrice(row.total)}
              </td>
              <td className="px-4 py-3.5">
                <InvoiceStatusBadge status={row.status} />
              </td>
              <td className="px-4 py-3.5 text-text-secondary">
                {row.dueDate ? formatDate(row.dueDate) : '—'}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Exporter PDF"
                    onClick={() => onExportPdf(row)}
                    loading={exportingId === row.id}
                  >
                    <FileDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Modifier la facture"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Supprimer la facture"
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
