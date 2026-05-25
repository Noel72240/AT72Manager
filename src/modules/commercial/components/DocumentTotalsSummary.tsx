import type { DocumentTotals } from '@/types/entities'
import { formatPrice } from '@/modules/commercial/utils/format-price'

type DocumentTotalsSummaryProps = {
  totals: DocumentTotals
  showVat?: boolean
}

export function DocumentTotalsSummary({ totals, showVat = true }: DocumentTotalsSummaryProps) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-hover/20 p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">Sous-total HT</span>
        <span className="font-medium text-text-primary">{formatPrice(totals.subtotal)}</span>
      </div>
      {showVat && (
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">TVA</span>
          <span className="font-medium text-text-primary">{formatPrice(totals.vatTotal)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-border/60 pt-2">
        <span className="text-sm font-semibold text-text-primary">Total TTC</span>
        <span className="text-lg font-bold gradient-text">{formatPrice(totals.total)}</span>
      </div>
    </div>
  )
}
