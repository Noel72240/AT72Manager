import { FileDown, FileText, Pencil, Receipt, Trash2 } from 'lucide-react'
import type { QuoteTableRow } from '@/modules/quotes/types/quote-module.types'
import { QuoteStatusBadge } from '@/modules/quotes/components/QuoteStatusBadge'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

type QuotesTableProps = {
  rows: QuoteTableRow[]
  onEdit: (row: QuoteTableRow) => void
  onDelete: (row: QuoteTableRow) => void
  onExportPdf: (row: QuoteTableRow) => void
  onConvert: (row: QuoteTableRow) => void
  deletingId?: string | null
  exportingId?: string | null
  convertingId?: string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function QuotesTable({
  rows,
  onEdit,
  onDelete,
  onExportPdf,
  onConvert,
  deletingId,
  exportingId,
  convertingId,
}: QuotesTableProps) {
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
            <th className="px-4 py-3 font-medium">Date</th>
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
                  <FileText className="size-4 text-neon-blue" />
                  <span className="font-mono text-xs font-medium text-text-primary">
                    {row.number}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5 font-medium text-text-primary">{row.clientName}</td>
              <td className="max-w-[200px] px-4 py-3.5 truncate text-text-secondary">
                {row.title || '—'}
              </td>
              <td className="px-4 py-3.5 font-semibold text-neon-blue">
                {formatPrice(row.total)}
              </td>
              <td className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-1">
                  <QuoteStatusBadge status={row.status} />
                  {row.convertedInvoiceId ? (
                    <Badge variant="default" className="text-[10px]">
                      Facturé
                    </Badge>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3.5 text-text-secondary">{formatDate(row.createdAt)}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Exporter PDF"
                    title="PDF"
                    onClick={() => onExportPdf(row)}
                    loading={exportingId === row.id}
                  >
                    <FileDown className="size-4" />
                  </Button>
                  {!row.convertedInvoiceId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Convertir en facture"
                      title="Facturer"
                      onClick={() => onConvert(row)}
                      loading={convertingId === row.id}
                    >
                      <Receipt className="size-4 text-neon-green" />
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Modifier le devis"
                    onClick={() => onEdit(row)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Supprimer le devis"
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
