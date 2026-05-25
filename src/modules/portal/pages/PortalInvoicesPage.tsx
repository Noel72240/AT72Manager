import { Download, Receipt } from 'lucide-react'
import { usePortalDataStore } from '@/store/portal-data.store'
import { portalPdfService } from '@/services/portal/portal-pdf.service'
import { INVOICE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'

export function PortalInvoicesPage() {
  const invoices = usePortalDataStore((s) => s.invoices)
  const client = usePortalDataStore((s) => s.client)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Mes factures</h1>

      {invoices.length === 0 ? (
        <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          Aucune facture disponible.
        </p>
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4"
            >
              <div className="flex gap-3">
                <Receipt className="size-5 text-neon-green" />
                <div>
                  <p className="font-medium text-text-primary">{inv.number}</p>
                  <p className="text-xs text-text-muted">{INVOICE_STATUS_LABELS[inv.status]}</p>
                  <p className="text-lg font-semibold tabular-nums text-neon-blue">
                    {formatPrice(inv.total)}
                  </p>
                </div>
              </div>
              {client ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void portalPdfService.downloadInvoicePdf(inv, client)}
                >
                  <Download className="size-4" />
                  PDF
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
