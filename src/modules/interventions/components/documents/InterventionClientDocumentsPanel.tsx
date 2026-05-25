import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy,
  Download,
  Eye,
  FileText,
  History,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import type { Intervention } from '@/types/entities'
import type { InterventionDocumentType } from '@/types/entities/intervention-document.types'
import {
  INTERVENTION_DOCUMENT_EVENT_LABELS,
  INTERVENTION_DOCUMENT_TYPE_LABELS,
} from '@/types/entities/intervention-document.types'
import type { PendingDocumentUpload } from '@/services/interventions/intervention-documents.service'
import { DocumentDropzone } from '@/modules/interventions/components/documents/DocumentDropzone'
import { useInterventionDocuments } from '@/modules/interventions/hooks/useInterventionDocuments'
import { documentSettingsService } from '@/services/settings/document-settings.service'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/cn'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { toast } from '@/store/toast.store'

const TYPE_OPTIONS = (
  Object.entries(INTERVENTION_DOCUMENT_TYPE_LABELS) as [InterventionDocumentType, string][]
).map(([value, label]) => ({ value, label }))

type InterventionClientDocumentsPanelProps = {
  intervention?: Intervention | null
  disabled?: boolean
  notifyClient?: boolean
  onNotifyClientChange?: (value: boolean) => void
  pendingUploads?: PendingDocumentUpload[]
  onPendingUploadsChange?: (items: PendingDocumentUpload[]) => void
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} o`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function InterventionClientDocumentsPanel({
  intervention,
  disabled,
  notifyClient = true,
  onNotifyClientChange,
  pendingUploads = [],
  onPendingUploadsChange,
}: InterventionClientDocumentsPanelProps) {
  const [docType, setDocType] = useState<InterventionDocumentType>('quote')
  const [historyOpen, setHistoryOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const {
    documents,
    events,
    loading,
    uploading,
    uploadProgress,
    upload,
    remove,
    download,
    copyLink,
    retry,
    canUpload,
  } = useInterventionDocuments(intervention)

  const accept = useMemo(
    () => documentSettingsService.getAllowedMimeTypes().join(','),
    [],
  )

  const maxLabel = documentSettingsService.formatMaxSizeLabel()

  async function handleFiles(files: FileList | File[]) {
    const file = Array.from(files)[0]
    if (!file) return

    if (!intervention?.id) {
      onPendingUploadsChange?.([...pendingUploads, { file, type: docType }])
      toast.success('Document en attente', 'Sera envoyé à la création de l\'intervention.')
      return
    }

    try {
      await upload(file, docType, notifyClient)
    } catch (error) {
      toast.error('Upload', formatSupabaseError(error))
    }
  }

  async function previewDocument(docId: string) {
    const doc = documents.find((d) => d.id === docId)
    if (!doc) return
    const url =
      doc.localDataUrl ??
      (await import('@/services/interventions/intervention-documents.service').then((m) =>
        m.interventionDocumentsService.getSignedDownloadUrl(doc, { actorType: 'workshop' }),
      ))
    if (url) setPreviewUrl(url)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Documents client
          </h4>
          <p className="text-xs text-text-muted">
            Devis, factures Qonto et pièces SAV — max {maxLabel}
          </p>
        </div>
        {intervention?.id ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="size-4" />
            Historique
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr,auto] sm:items-end">
        <Select
          label="Type de document"
          value={docType}
          onChange={(e) => setDocType(e.target.value as InterventionDocumentType)}
          options={TYPE_OPTIONS}
          disabled={disabled || uploading}
        />
      </div>

      <DocumentDropzone
        disabled={disabled || (Boolean(intervention?.id) && !canUpload)}
        uploading={uploading}
        progress={uploadProgress}
        accept={accept}
        hint={`Glissez un PDF ou image (max ${maxLabel})`}
        onFiles={handleFiles}
      />

      {onNotifyClientChange ? (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={notifyClient}
            onChange={(e) => onNotifyClientChange(e.target.checked)}
            disabled={disabled}
            className="rounded border-border"
          />
          Notifier le client sur le portail (devis / facture)
        </label>
      ) : null}

      {pendingUploads.length > 0 ? (
        <div className="rounded-xl border border-neon-blue/30 bg-neon-blue/5 p-3 text-sm">
          <p className="font-medium text-text-primary">En attente de création</p>
          <ul className="mt-2 space-y-1 text-text-secondary">
            {pendingUploads.map((item, i) => (
              <li key={`${item.file.name}-${i}`}>
                {INTERVENTION_DOCUMENT_TYPE_LABELS[item.type]} — {item.file.name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <ul className="space-y-2">
            {documents.map((doc) => (
              <motion.li
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-xl border px-3 py-3',
                  doc.syncStatus === 'error'
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-border/70 bg-surface-hover/20',
                )}
              >
                <FileText className="size-5 shrink-0 text-neon-blue" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{doc.fileName}</p>
                  <p className="text-xs text-text-muted">
                    {INTERVENTION_DOCUMENT_TYPE_LABELS[doc.type]} · {formatBytes(doc.size)} ·{' '}
                    {formatDate(doc.createdAt)}
                  </p>
                  {doc.syncStatus === 'error' && doc.uploadError ? (
                    <p className="text-xs text-red-400">{doc.uploadError}</p>
                  ) : doc.syncStatus === 'error' ? (
                    <p className="text-xs text-red-400">Upload échoué</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  {doc.mimeType === 'application/pdf' ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void previewDocument(doc.id)}>
                      <Eye className="size-4" />
                    </Button>
                  ) : null}
                  <Button type="button" variant="ghost" size="sm" onClick={() => void download(doc)}>
                    <Download className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void copyLink(doc)}>
                    <Copy className="size-4" />
                  </Button>
                  {doc.syncStatus === 'error' ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => void retry(doc)}>
                      <RefreshCw className="size-4" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    disabled={disabled}
                    onClick={() => void remove(doc)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      )}

      {!loading && documents.length === 0 && pendingUploads.length === 0 ? (
        <p className="text-center text-xs text-text-muted py-2">Aucun document pour cette intervention.</p>
      ) : null}

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title="Historique documents" size="md">
        {events.length === 0 ? (
          <p className="text-sm text-text-muted">Aucun événement enregistré.</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {events.map((evt) => (
              <li key={evt.id} className="rounded-lg border border-border/60 px-3 py-2">
                <p className="font-medium text-text-primary">
                  {INTERVENTION_DOCUMENT_EVENT_LABELS[evt.eventType]}
                </p>
                <p className="text-xs text-text-muted">{formatDate(evt.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} title="Aperçu PDF" size="lg">
        {previewUrl ? (
          <iframe title="Aperçu document" src={previewUrl} className="h-[70vh] w-full rounded-lg border border-border" />
        ) : null}
      </Modal>
    </section>
  )
}
