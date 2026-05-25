import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalDataStore } from '@/store/portal-data.store'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { portalApiService } from '@/services/portal/portal-api.service'
import { portalPdfService } from '@/services/portal/portal-pdf.service'
import { ClientSignaturePad } from '@/modules/portal/components/ClientSignaturePad'
import { QUOTE_STATUS_LABELS } from '@/modules/commercial/utils/commercial-labels'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'
import type { PortalQuoteValidation } from '@/types/portal.types'

export function PortalQuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const quotes = usePortalDataStore((s) => s.quotes)
  const client = usePortalDataStore((s) => s.client)
  const session = usePortalAuthStore((s) => s.session)
  const refresh = usePortalDataStore((s) => s.refresh)
  const quote = quotes.find((q) => q.id === id)
  const [validation, setValidation] = useState<PortalQuoteValidation | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!id || !session?.clientId) return
    void portalApiService.fetchQuoteValidation(id, session.clientId).then(setValidation)
  }, [id, session?.clientId])

  if (!quote || !client || !session) {
    return <p className="p-8 text-sm text-text-muted">Devis introuvable.</p>
  }

  async function handleValidation(status: 'accepted' | 'rejected', signatureData?: string) {
    if (!quote || !session) return
    setLoading(true)
    try {
      const result = await portalApiService.validateQuote({
        quoteId: quote.id,
        clientId: session.clientId,
        workshopId: session.workshopId,
        status,
        signatureData,
        clientNote: note || undefined,
      })
      if (signatureData) {
        await portalApiService.saveSignature({
          clientId: session.clientId,
          workshopId: session.workshopId,
          purpose: 'quote_acceptance',
          signatureData,
          quoteId: quote.id,
        })
      }
      setValidation(result)
      await refresh(session.clientId)
      toast.success(status === 'accepted' ? 'Devis accepté' : 'Devis refusé')
    } catch (e) {
      toast.error('Erreur', e instanceof Error ? e.message : 'Validation impossible')
    } finally {
      setLoading(false)
    }
  }

  const canValidate = quote.status === 'sent' && validation?.status !== 'accepted'

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 pb-12 lg:p-8">
      <Link to={PORTAL_ROUTES.QUOTES} className="inline-flex items-center gap-1 text-sm text-text-muted">
        <ArrowLeft className="size-4" /> Devis
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">{quote.number}</h1>
        <p className="text-sm text-text-secondary">{quote.title}</p>
        <p className="mt-2 text-3xl font-bold text-neon-blue">{formatPrice(quote.total)}</p>
        <p className="text-xs text-text-muted">{QUOTE_STATUS_LABELS[quote.status]}</p>
      </header>

      <ul className="rounded-2xl border border-border divide-y divide-border text-sm">
        {quote.lines.map((line) => (
          <li key={line.id} className="flex justify-between px-4 py-3">
            <span>{line.description}</span>
            <span className="tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <Button
        variant="secondary"
        onClick={() => void portalPdfService.downloadQuotePdf(quote, client)}
      >
        <Download className="size-4" />
        Télécharger PDF
      </Button>

      {canValidate ? (
        <section className="space-y-4 rounded-2xl border border-neon-blue/20 bg-neon-blue/5 p-4">
          <h2 className="font-semibold text-text-primary">Validation du devis</h2>
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            placeholder="Commentaire optionnel"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <ClientSignaturePad
            label="Signature pour acceptation"
            onSave={(sig) => void handleValidation('accepted', sig)}
          />
          <Button variant="secondary" loading={loading} onClick={() => void handleValidation('rejected')}>
            Refuser le devis
          </Button>
        </section>
      ) : validation?.status === 'accepted' ? (
        <p className="text-sm text-neon-green">Devis accepté et signé.</p>
      ) : null}
    </div>
  )
}
