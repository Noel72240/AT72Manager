import { useCallback, useEffect, useState } from 'react'
import { sparePartsRepository } from '@/services/database/repositories/spare-parts.repository'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import type { SparePart, SparePartInsert, SparePartUpdate } from '@/types/entities'

type PartPayload = Omit<SparePartInsert, 'userId'>

export function useSpareParts() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)
  const [parts, setParts] = useState<SparePart[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchParts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await sparePartsRepository.list()
      setParts(data)
    } catch (error) {
      toast.error('Chargement impossible', formatSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchParts()
  }, [fetchParts])

  const createPart = useCallback(
    async (payload: PartPayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer une pièce.')
        return null
      }
      setSaving(true)
      try {
        const part = await sparePartsRepository.create({ ...payload, userId })
        setParts((prev) => [part, ...prev])
        await refreshSync()
        await emitFeedItem(userId, {
          kind: 'part_added',
          title: 'Pièce ajoutée au catalogue',
          message: `${part.name} — ${part.reference}`,
          href: ROUTES.PARTS,
          entityType: 'spare_part',
          entityId: part.id,
        })
        toast.success('Pièce créée', part.name)
        return part
      } catch (error) {
        toast.error('Création impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  const updatePart = useCallback(
    async (id: string, payload: SparePartUpdate) => {
      setSaving(true)
      try {
        const part = await sparePartsRepository.update(id, payload)
        setParts((prev) => prev.map((item) => (item.id === id ? part : item)))
        await refreshSync()
        toast.success('Pièce mise à jour', part.name)
        return part
      } catch (error) {
        toast.error('Mise à jour impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync],
  )

  const removePart = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await sparePartsRepository.remove(id)
        setParts((prev) => prev.filter((item) => item.id !== id))
        await refreshSync()
        toast.success('Pièce supprimée')
        return true
      } catch (error) {
        toast.error('Suppression impossible', formatSupabaseError(error))
        return false
      } finally {
        setSaving(false)
      }
    },
    [refreshSync],
  )

  return { parts, loading, saving, fetchParts, createPart, updatePart, removePart }
}
