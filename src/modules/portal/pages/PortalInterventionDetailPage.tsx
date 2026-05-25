import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Download, Image as ImageIcon } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalDataStore } from '@/store/portal-data.store'
import { RepairTimeline } from '@/modules/portal/components/RepairTimeline'
import { buildRepairTimeline, getTimelineProgress } from '@/services/portal/portal-timeline.service'
import { portalPdfService } from '@/services/portal/portal-pdf.service'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'

export function PortalInterventionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const client = usePortalDataStore((s) => s.client)
  const interventions = usePortalDataStore((s) => s.interventions)
  const repairEvents = usePortalDataStore((s) => s.repairEvents)
  const [pdfLoading, setPdfLoading] = useState(false)

  const intervention = useMemo(
    () => interventions.find((i) => i.id === id),
    [interventions, id],
  )

  const events = repairEvents.filter((e) => e.interventionId === id)
  const steps = intervention ? buildRepairTimeline(intervention, events) : []
  const progress = steps.length ? getTimelineProgress(steps) : 0
  const photos = intervention?.media?.photos ?? []

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
