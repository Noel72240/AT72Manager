import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, Eye, FileText } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'
import { interventionDocumentsService } from '@/services/interventions/intervention-documents.service'
import {
  INTERVENTION_DOCUMENT_TYPE_LABELS,
  type PortalClientDocument,
} from '@/types/entities/intervention-document.types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { toast } from '@/store/toast.store'

const BADGE_STYLES = {
  new: 'bg-neon-blue/15 text-neon-blue border-neon-blue/30',
  read: 'bg-surface-hover text-text-muted border-border',
  downloaded: 'bg-neon-green/10 text-neon-green border-neon-green/30',
} as const

const BADGE_LABELS = {
  new: 'Nouveau',
  read: 'Lu',
  downloaded: 'Téléchargé',
} as const

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function PortalDocumentsPage() {
  const session = usePortalAuthStore((s) => s.session)
  const client = usePortalDataStore((s) => s.client)
  const portalDocuments = usePortalDataStore((s) => s.portalDocuments)
  const loading = usePortalDataStore((s) => s.loading)
  const refresh = usePortalDataStore((s) => s.refresh)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, PortalClientDocument[]>()
    for (const doc of portalDocuments) {
      const list = map.get(doc.type) ?? []
      list.push(doc)
      map.set(doc.type, list)
    }
    return map
  }, [portalDocuments])

  async function handleView(doc: PortalClientDocument) {
    if (!session) return
    setBusyId(doc.id)
    try {
      await interventionDocumentsService.markPortalViewed(doc, session.clientId, session.authUserId)
      const url = await interventionDocumentsService.getSignedDownloadUrl(doc, {
        actorType: 'client',
        actorId: session.authUserId,
        clientId: session.clientId,
      })
      if (!url) {
        toast.error('Document', 'Fichier indisponible.')
        return
      }
      if (doc.mimeType === 'application/pdf') {
        setPreviewUrl(url)
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      await refresh(session.clientId)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDownload(doc: PortalClientDocument) {
    if (!session) return
    setBusyId(doc.id)
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
      toast.success('Téléchargement', doc.fileName)
      await refresh(session.clientId)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl space-y-6 p-4 pb-16 lg:p-8"
    >
      <header>
        <h1 className="text-2xl font-semibold text-text-primary">Mes documents</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Devis, factures et documents SAV partagés par {client?.firstName ?? 'votre atelier'}.
        </p>
      </header>

      {loading && portalDocuments.length === 0 ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : portalDocuments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-text-muted">
          Aucun document disponible pour le moment.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([type, docs]) => (
          <section key={type} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              {INTERVENTION_DOCUMENT_TYPE_LABELS[type as keyof typeof INTERVENTION_DOCUMENT_TYPE_LABELS]}
            </h2>
            <ul className="space-y-3">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  className="rounded-2xl border border-border/80 bg-surface-elevated p-4 shadow-sm transition hover:border-neon-blue/25"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-neon-blue/10">
                        <FileText className="size-5 text-neon-blue" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-medium text-text-primary">{doc.fileName}</p>
                          <span
                            className={cn(
                              'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase',
                              BADGE_STYLES[doc.badge],
                            )}
                          >
                            {BADGE_LABELS[doc.badge]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {doc.interventionLabel ?? 'Intervention'} · {formatDate(doc.createdAt)}
                        </p>
                        {doc.deviceLabel ? (
                          <p className="text-xs text-text-muted">{doc.deviceLabel}</p>
                        ) : null}
                        <Link
                          to={PORTAL_ROUTES.INTERVENTION_DETAIL.replace(':id', doc.interventionId)}
                          className="mt-1 inline-block text-xs text-neon-blue hover:underline"
                        >
                          Voir la réparation
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === doc.id}
                        onClick={() => void handleView(doc)}
                      >
                        <Eye className="size-4" />
                        {doc.mimeType === 'application/pdf' ? 'Aperçu' : 'Ouvrir'}
                      </Button>
                      <Button
                        size="sm"
                        loading={busyId === doc.id}
                        onClick={() => void handleDownload(doc)}
                      >
                        <Download className="size-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Modal open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} title="Aperçu document" size="lg">
        {previewUrl ? (
          <iframe title="Aperçu" src={previewUrl} className="h-[75vh] w-full rounded-xl border border-border" />
        ) : null}
      </Modal>
    </motion.div>
  )
}
