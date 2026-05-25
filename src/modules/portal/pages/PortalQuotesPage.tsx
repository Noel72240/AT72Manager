import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalDataStore } from '@/store/portal-data.store'
import { QUOTE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { formatPrice } from '@/modules/commercial/utils/format-price'

export function PortalQuotesPage() {
  const quotes = usePortalDataStore((s) => s.quotes)

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12 lg:p-8">
      <h1 className="text-2xl font-semibold text-text-primary">Mes devis</h1>

      {quotes.length === 0 ? (
        <p className="rounded-2xl border border-border p-8 text-center text-sm text-text-muted">
          Aucun devis disponible.
        </p>
      ) : (
        <ul className="space-y-3">
          {quotes.map((q) => (
            <li key={q.id}>
              <Link
                to={PORTAL_ROUTES.QUOTE_DETAIL.replace(':id', q.id)}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface-elevated p-4 transition hover:border-neon-blue/30"
              >
                <div className="flex gap-3">
                  <FileText className="size-5 shrink-0 text-neon-blue" />
                  <div>
                    <p className="font-medium text-text-primary">{q.number}</p>
                    <p className="text-xs text-text-muted">{QUOTE_STATUS_LABELS[q.status]}</p>
                  </div>
                </div>
                <span className="font-semibold tabular-nums text-neon-blue">
                  {formatPrice(q.total)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
