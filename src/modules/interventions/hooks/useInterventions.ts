import { useCallback, useEffect, useState } from 'react'
import { interventionsRepository } from '@/services/database/repositories/interventions.repository'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { handleDocumentStockTransition } from '@/modules/inventory/services/stock.service'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import type { Intervention, InterventionInsert, InterventionUpdate } from '@/types/entities'

type InterventionPayload = Omit<InterventionInsert, 'userId'>

export function useInterventions() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)

  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchInterventions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await interventionsRepository.list()
      setInterventions(data)
    } catch (error) {
      toast.error(
        'Chargement impossible',
        formatSupabaseError(error),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInterventions()
  }, [fetchInterventions])

  const createIntervention = useCallback(
    async (payload: InterventionPayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer une intervention.')
        return null
      }

      setSaving(true)
      try {
        const item = await interventionsRepository.create({ ...payload, userId })
        setInterventions((prev) => [item, ...prev])
        await refreshSync()
        await emitFeedItem(userId, {
          kind: 'intervention_created',
          title: 'Nouvelle intervention',
          message: payload.reportedIssue.slice(0, 80),
          href: ROUTES.INTERVENTIONS,
          entityType: 'intervention',
          entityId: item.id,
        })
        toast.success('Intervention créée', payload.reportedIssue)
        return item
      } catch (error) {
        toast.error(
          'Création impossible',
          formatSupabaseError(error),
        )
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  const updateIntervention = useCallback(
    async (id: string, payload: InterventionUpdate) => {
      if (!userId) return null
      const existing = interventions.find((row) => row.id === id)
      setSaving(true)
      try {
        const patch: InterventionUpdate = { ...payload }
        if (payload.status === 'completed' && existing?.status !== 'completed') {
          patch.completedAt = payload.completedAt ?? new Date().toISOString()
        }

        const item = await interventionsRepository.update(id, patch)
        const prevLines = existing?.partsLines ?? []
        const nextLines = item.partsLines ?? []
        const wasDeducting = existing?.status === 'completed'
        const isDeducting = item.status === 'completed'
        try {
          await handleDocumentStockTransition(prevLines, nextLines, wasDeducting, isDeducting, userId, {
            referenceType: 'intervention',
            referenceId: id,
            movementType: 'intervention',
          })
        } catch (stockError) {
          toast.error('Stock', formatSupabaseError(stockError))
        }
        setInterventions((prev) => prev.map((row) => (row.id === id ? item : row)))
        await refreshSync()

        if (payload.scheduledAt && payload.scheduledAt !== existing?.scheduledAt) {
          await emitFeedItem(
            userId,
            {
              kind: 'intervention_scheduled',
              title: 'Rendez-vous replanifié',
              message: `${item.reportedIssue.slice(0, 60)} · ${new Date(payload.scheduledAt).toLocaleString('fr-FR')}`,
              href: ROUTES.CALENDAR,
              entityType: 'intervention',
              entityId: item.id,
              dedupeKey: `intervention_scheduled:${item.id}:${payload.scheduledAt.slice(0, 16)}`,
            },
            { dedupe: true },
          )
        }

        await emitFeedItem(
          userId,
          {
            kind:
              item.status === 'completed' && existing?.status !== 'completed'
                ? 'intervention_completed'
                : 'intervention_updated',
            title:
              item.status === 'completed' && existing?.status !== 'completed'
                ? 'Intervention terminée'
                : 'Intervention mise à jour',
            message: item.reportedIssue.slice(0, 80),
            href: ROUTES.INTERVENTIONS,
            entityType: 'intervention',
            entityId: item.id,
            dedupeKey:
              item.status === 'completed'
                ? `intervention_completed:${item.id}`
                : undefined,
          },
          {
            toast: item.status === 'completed' && existing?.status !== 'completed',
            toastVariant: 'success',
          },
        )
        toast.success('Intervention mise à jour')
        return item
      } catch (error) {
        toast.error(
          'Mise à jour impossible',
          formatSupabaseError(error),
        )
        return null
      } finally {
        setSaving(false)
      }
    },
    [interventions, refreshSync, userId],
  )

  const removeIntervention = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await interventionsRepository.remove(id)
        setInterventions((prev) => prev.filter((row) => row.id !== id))
        await refreshSync()
        toast.success('Intervention supprimée')
        return true
      } catch (error) {
        toast.error(
          'Suppression impossible',
          formatSupabaseError(error),
        )
        return false
      } finally {
        setSaving(false)
      }
    },
    [refreshSync],
  )

  return {
    interventions,
    loading,
    saving,
    fetchInterventions,
    createIntervention,
    updateIntervention,
    removeIntervention,
  }
}
