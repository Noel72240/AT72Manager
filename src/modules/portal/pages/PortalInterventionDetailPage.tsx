import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalDataStore } from '@/store/portal-data.store'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { RepairTimeline } from '@/modules/portal/components/RepairTimeline'
import { buildRepairTimeline, getTimelineProgress } from '@/services/portal/portal-timeline.service'
import { portalPdfService } from '@/services/portal/portal-pdf.service'
import { interventionDocumentsService } from '@/services/interventions/intervention-documents.service'
import { INTERVENTION_DOCUMENT_TYPE_LABELS } from '@/types/entities/intervention-document.types'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { PAYMENT_STATUS_LABELS } from '@/modules/interventions/utils/payment-labels'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'

export function PortalInterventionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const client = usePortalDataStore((s) => s.client)
  const interventions = usePortalDataStore((s) => s.interventions)
  const repairEvents = usePortalDataStore((s) => s.repairEvents)
  const portalDocuments = usePortalDataStore((s) => s.portalDocuments)
  const refresh = usePortalDataStore((s) => s.refresh)
  const session = usePortalAuthStore((s) => s.session)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [docLoadingId, setDocLoadingId] = useState<string | null>(null)

  const intervention = useMemo(
    () => interventions.find((i) => i.id === id),
    [interventions, id],
  )

  const interventionDocuments = useMemo(
    () => portalDocuments.filter((doc) => doc.interventionId === id),
    [portalDocuments, id],
  )

  const events = repairEvents.filter((e) => e.interventionId === id)
  const steps = intervention ? buildRepairTimeline(intervention, events) : []
  const progress = steps.length ? getTimelineProgress(steps) : 0
  const photos = intervention?.media?.photos ?? []

  async function downloadClientDocument(doc: (typeof interventionDocuments)[number]) {
    if (!session) return
    setDocLoadingId(doc.id)
    try {
      const url = await interventionDocumentsService.getSignedDownloadUrl(doc, {
        actorType: 'client',
        actorId: session.authUserId,
        clientId: session.clientId,
      })
      if (!url) {
        toast.error('Téléchargement', 'Document indisponible.')
        return
      }
      const link = document.createElement('a')
      link.href = url
      link.download = doc.fileName
      link.click()
      toast.success('Document', 'Téléchargement lancé.')
      await refresh(session.clientId)
    } catch {
      toast.error('Téléchargement', 'Impossible de récupérer le document.')
    } finally {
      setDocLoadingId(null)
    }
  }

  async function downloadReport() {
    if (!intervention || !client) return
    setPdfLoading(true)
    try {
      await portalPdfService.downloadSavReport(intervention, client)
      toast.success('PDF', 'Rapport SAV téléchargé.')
    } catch {
      toast.error('PDF', 'Impossible de générer le rapport.')
    } finally {
      setPdfLoading(false)
    }
  }

  if (!intervention) {
    return (
      <div className="p-8 text-center text-sm text-text-muted">
        Intervention introuvable.{' '}
        <Link to={PORTAL_ROUTES.INTERVENTIONS} className="text-neon-blue">
          Retour
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-12 lg:p-8">
      <Link
        to={PORTAL_ROUTES.INTERVENTIONS}
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-neon-blue"
      >
        <ArrowLeft className="size-4" />
        Mes réparations
      </Link>

      <header>
        <h1 className="text-2xl font-semibold text-text-primary">
          {intervention.deviceLabel || 'Réparation'}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{intervention.reportedIssue}</p>
        <span className="mt-2 inline-block rounded-full bg-neon-blue/10 px-3 py-1 text-xs text-neon-blue">
          {STATUS_LABELS[intervention.status]}
        </span>
      </header>

      <section className="rounded-2xl border border-border bg-surface-elevated p-5">
        <RepairTimeline steps={steps} progress={progress} />
      </section>

      {intervention.diagnostic ? (
        <section className="rounded-2xl border border-border p-4">
          <h2 className="text-sm font-semibold text-text-primary">Diagnostic</h2>
          <p className="mt-2 text-sm text-text-secondary">{intervention.diagnostic}</p>
        </section>
      ) : null}

      {(intervention.estimatedPrice !== undefined ||
        intervention.paymentStatus ||
        intervention.depositAmount !== undefined) && (
        <section className="rounded-2xl border border-border p-4 text-sm">
          <h2 className="text-sm font-semibold text-text-primary">Estimation & paiement</h2>
          <p className="mt-2 text-text-secondary">
            Estimation : {formatPrice(intervention.estimatedPrice)}
            {intervention.finalPrice !== undefined
              ? ` · Final : ${formatPrice(intervention.finalPrice)}`
              : ''}
          </p>
          {intervention.depositAmount !== undefined ? (
            <p className="mt-1 text-text-secondary">
              Acompte : {formatPrice(intervention.depositAmount)}
            </p>
          ) : null}
          <p className="mt-1 text-text-muted">
            {PAYMENT_STATUS_LABELS[intervention.paymentStatus ?? 'none']}
            {intervention.billedViaQonto ? ' · Facturé via Qonto' : ''}
          </p>
        </section>
      )}

      {interventionDocuments.length > 0 ? (
        <section className="rounded-2xl border border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FileText className="size-4 text-neon-blue" />
              Documents
            </h2>
            <Link to={PORTAL_ROUTES.DOCUMENTS} className="text-xs text-neon-blue hover:underline">
              Tous mes documents
            </Link>
          </div>
          <ul className="space-y-2">
            {interventionDocuments.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-surface-hover/20 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {INTERVENTION_DOCUMENT_TYPE_LABELS[doc.type]}
                  </p>
                  <p className="text-xs text-text-muted">{doc.fileName}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={docLoadingId === doc.id}
                  onClick={() => void downloadClientDocument(doc)}
                >
                  <Download className="size-4" />
                  Télécharger
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {photos.length > 0 ? (
        <section className="rounded-2xl border border-border p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
            <ImageIcon className="size-4 text-neon-blue" />
            Photos atelier
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.dataUrl}
                alt={photo.name}
                className="aspect-square rounded-xl border border-border object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      {intervention.scheduledAt ? (
        <section className="rounded-2xl border border-border p-4 text-sm">
          <p className="text-text-muted">Rendez-vous planifié</p>
          <p className="font-medium text-text-primary">
            {new Date(intervention.scheduledAt).toLocaleString('fr-FR')}
          </p>
        </section>
      ) : null}

      <Button onClick={() => void downloadReport()} loading={pdfLoading} variant="secondary">
        <Download className="size-4" />
        Télécharger le rapport SAV (PDF)
      </Button>
    </div>
  )
}
