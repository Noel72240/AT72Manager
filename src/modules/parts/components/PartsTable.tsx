import { Pencil, Trash2 } from 'lucide-react'
import type { PartTableRow } from '@/modules/parts/types/part-module.types'
import { StockLevelBadge } from '@/modules/parts/components/StockLevelBadge'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'

type PartsTableProps = {
  rows: PartTableRow[]
  onEdit: (row: PartTableRow) => void
  onDelete: (row: PartTableRow) => void
  deletingId?: string | null
}

export function PartsTable({ rows, onEdit, onDelete, deletingId }: PartsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/80 text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-3 font-medium">Pièce</th>
            <th className="px-4 py-3 font-medium">Réf.</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Achat</th>
            <th className="px-4 py-3 font-medium">Vente</th>
            <th className="px-4 py-3 font-medium">Marge</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border/50 hover:bg-surface-hover/40">
              <td className="px-4 py-3.5">
                <p className="font-medium text-text-primary">{row.name}</p>
                <p className="text-xs text-text-muted">{row.supplier || '—'}</p>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs">{row.reference}</td>
              <td className="px-4 py-3.5 text-text-secondary">{row.category}</td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{row.quantity}</span>
                  <StockLevelBadge level={row.stockLevel} />
                </div>
                <p className="text-[10px] text-text-muted">Seuil {row.minThreshold}</p>
              </td>
              <td className="px-4 py-3.5">{formatPrice(row.purchasePrice)}</td>
              <td className="px-4 py-3.5 text-neon-blue">{formatPrice(row.salePrice)}</td>
              <td className="px-4 py-3.5">
                <p className="text-neon-green">{formatPrice(row.marginAmount)}</p>
                <p className="text-[10px] text-text-muted">{row.marginPercent.toFixed(0)} %</p>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(row)}
                    loading={deletingId === row.id}
                    className="text-danger hover:bg-danger/10"
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
