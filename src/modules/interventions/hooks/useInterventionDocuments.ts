import { useCallback, useEffect, useState } from 'react'
import type { Intervention } from '@/types/entities'
import type {
  InterventionDocument,
  InterventionDocumentEvent,
  InterventionDocumentType,
} from '@/types/entities/intervention-document.types'
import { interventionDocumentsService } from '@/services/interventions/intervention-documents.service'
import { useAuthStore } from '@/store/auth.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'

export function useInterventionDocuments(intervention: Intervention | null | undefined) {
  const user = useAuthStore((s) => s.user)
  const [documents, setDocuments] = useState<InterventionDocument[]>([])
  const [events, setEvents] = useState<InterventionDocumentEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const refresh = useCallback(async () => {
    if (!intervention?.id) {
      setDocuments([])
      setEvents([])
      return
    }
    setLoading(true)
    try {
      if (user?.workshopId && user.id) {
        await interventionDocumentsService.migrateLegacyMediaDocuments(
          intervention,
          user.workshopId,
          user.id,
          user.fullName ?? 'Atelier',
        )
      }
      const [docs, evts] = await Promise.all([
        interventionDocumentsService.listForIntervention(intervention.id),
        interventionDocumentsService.listEvents(intervention.id),
      ])
      setDocuments(docs.filter((d) => !d.deletedAt))
      setEvents(evts)
    } catch (error) {
      toast.error('Documents', formatSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }, [intervention, user?.fullName, user?.id, user?.workshopId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upload = useCallback(
    async (file: File, type: InterventionDocumentType, notifyClient = true) => {
      if (!intervention?.id || !user?.workshopId || !user.id) {
        toast.error('Session', 'Connectez-vous pour envoyer un document.')
        return null
      }
      setUploading(true)
      setUploadProgress(0)
      try {
        const doc = await interventionDocumentsService.upload({
          file,
          type,
          intervention,
          workshopId: user.workshopId,
          userId: user.id,
          actorName: user.fullName ?? 'Atelier',
          notifyClient,
          onProgress: setUploadProgress,
        })
        toast.success('Document envoyé', doc.fileName)
        await refresh()
        return doc
      } catch (error) {
        toast.error('Envoi impossible', formatSupabaseError(error))
        return null
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [intervention, refresh, user],
  )

  const remove = useCallback(
    async (doc: InterventionDocument) => {
      if (!user?.workshopId || !user.id) return
      try {
        await interventionDocumentsService.softDelete(doc, {
          userId: user.id,
          actorName: user.fullName ?? 'Atelier',
          workshopId: user.workshopId,
        })
        toast.success('Document supprimé')
        await refresh()
      } catch (error) {
        toast.error('Suppression', formatSupabaseError(error))
      }
    },
    [refresh, user],
  )

  const download = useCallback(async (doc: InterventionDocument) => {
    const url = await interventionDocumentsService.getSignedDownloadUrl(doc, {
      actorType: 'workshop',
      actorId: user?.id,
    })
    if (!url) {
      toast.error('Téléchargement', 'Document indisponible.')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [user?.id])

  const copyLink = useCallback(
    async (doc: InterventionDocument) => {
      try {
        await interventionDocumentsService.copySignedLink(doc)
        await interventionDocumentsService.recordEvent({
          documentId: doc.id,
          interventionId: doc.interventionId,
          clientId: doc.clientId,
          workshopId: doc.workshopId,
          eventType: 'link_copied',
          actorType: 'workshop',
          actorId: user?.id ?? 'unknown',
        })
        toast.success('Lien copié', 'Lien sécurisé copié (expiration limitée).')
        await refresh()
      } catch (error) {
        toast.error('Lien', formatSupabaseError(error))
      }
    },
    [refresh, user?.id],
  )

  const retry = useCallback(
    async (doc: InterventionDocument) => {
      if (!user?.id) return
      setUploading(true)
      try {
        await interventionDocumentsService.retryUpload(doc, {
          userId: user.id,
          actorName: user.fullName ?? 'Atelier',
        })
        toast.success('Document synchronisé')
        await refresh()
      } catch (error) {
        toast.error('Nouvel essai', formatSupabaseError(error))
      } finally {
        setUploading(false)
      }
    },
    [refresh, user],
  )

  return {
    documents,
    events,
    loading,
    uploading,
    uploadProgress,
    refresh,
    upload,
    remove,
    download,
    copyLink,
    retry,
    canUpload: Boolean(intervention?.id && user?.workshopId),
  }
}
