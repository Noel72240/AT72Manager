import { useCallback, useEffect, useState } from 'react'
import { devicesRepository } from '@/services/database/repositories/devices.repository'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import type { Device, DeviceInsert, DeviceUpdate } from '@/types/entities'

type DevicePayload = Omit<DeviceInsert, 'userId'>

export function useDevices() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)

  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await devicesRepository.list()
      setDevices(data)
    } catch (error) {
      toast.error('Chargement impossible', formatSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDevices()
  }, [fetchDevices])

  const createDevice = useCallback(
    async (payload: DevicePayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer un appareil.')
        return null
      }

      setSaving(true)
      try {
        const item = await devicesRepository.create({ ...payload, userId })
        setDevices((prev) => [item, ...prev])
        await refreshSync()
        await emitFeedItem(userId, {
          kind: 'device_created',
          title: 'Appareil enregistré',
          message: [payload.brand, payload.model].filter(Boolean).join(' ') || payload.deviceType,
          href: ROUTES.DEVICES,
          entityType: 'device',
          entityId: item.id,
        })
        toast.success('Appareil créé', payload.deviceType)
        return item
      } catch (error) {
        toast.error('Création impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  const updateDevice = useCallback(
    async (id: string, payload: DeviceUpdate) => {
      setSaving(true)
      try {
        const item = await devicesRepository.update(id, payload)
        setDevices((prev) => prev.map((row) => (row.id === id ? item : row)))
        await refreshSync()
        toast.success('Appareil mis à jour')
        return item
      } catch (error) {
        toast.error('Mise à jour impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync],
  )

  const removeDevice = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await devicesRepository.remove(id)
        setDevices((prev) => prev.filter((row) => row.id !== id))
        await refreshSync()
        toast.success('Appareil supprimé')
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

  return {
    devices,
    loading,
    saving,
    fetchDevices,
    createDevice,
    updateDevice,
    removeDevice,
  }
}
