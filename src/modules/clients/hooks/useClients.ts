import { useCallback, useEffect, useState } from 'react'
import { clientsRepository } from '@/services/database/repositories/clients.repository'
import { useAudit } from '@/hooks/useAudit'
import { usePermissions } from '@/hooks/usePermissions'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import type { Client, ClientInsert, ClientUpdate } from '@/types/entities'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'

type ClientPayload = Omit<ClientInsert, 'userId'>

export function useClients() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)
  const { can } = usePermissions()
  const { log: logAudit } = useAudit()

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const data = await clientsRepository.list()
      setClients(data)
    } catch (error) {
      toast.error(
        'Chargement impossible',
        error instanceof Error ? error.message : 'Une erreur est survenue.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchClients()
  }, [fetchClients])

  const createClient = useCallback(
    async (payload: ClientPayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer un client.')
        return null
      }
      if (!can('clients', 'create')) {
        toast.error('Permission refusée', 'Votre rôle ne permet pas de créer des clients.')
        return null
      }

      setSaving(true)
      try {
        const client = await clientsRepository.create({ ...payload, userId })
        setClients((prev) => [client, ...prev])
        await refreshSync()
        await emitFeedItem(
          userId,
          {
            kind: 'client_created',
            title: 'Nouveau client',
            message: getClientFullName(client),
            href: ROUTES.CLIENTS,
            entityType: 'client',
            entityId: client.id,
          },
          { toast: false },
        )
        toast.success('Client créé', getClientFullName(client))
        await logAudit({
          action: 'create',
          resource: 'client',
          resourceId: client.id,
          summary: `Client créé : ${getClientFullName(client)}`,
        })
        return client
      } catch (error) {
        toast.error(
          'Création impossible',
          error instanceof Error ? error.message : 'Une erreur est survenue.',
        )
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId, can, logAudit],
  )

  const updateClient = useCallback(
    async (id: string, payload: ClientUpdate) => {
      if (!can('clients', 'update')) {
        toast.error('Permission refusée', 'Modification non autorisée.')
        return null
      }
      setSaving(true)
      try {
        const client = await clientsRepository.update(id, payload)
        setClients((prev) => prev.map((item) => (item.id === id ? client : item)))
        await refreshSync()
        toast.success('Client mis à jour', getClientFullName(client))
        await logAudit({
          action: 'update',
          resource: 'client',
          resourceId: client.id,
          summary: `Client modifié : ${getClientFullName(client)}`,
        })
        return client
      } catch (error) {
        toast.error(
          'Mise à jour impossible',
          error instanceof Error ? error.message : 'Une erreur est survenue.',
        )
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, can, logAudit],
  )

  const removeClient = useCallback(
    async (id: string) => {
      if (!can('clients', 'delete')) {
        toast.error('Permission refusée', 'Suppression non autorisée.')
        return false
      }
      setSaving(true)
      try {
        const existing = clients.find((item) => item.id === id)
        await clientsRepository.remove(id)
        setClients((prev) => prev.filter((item) => item.id !== id))
        await refreshSync()
        toast.success('Client supprimé')
        if (existing) {
          await logAudit({
            action: 'delete',
            resource: 'client',
            resourceId: id,
            summary: `Client supprimé : ${getClientFullName(existing)}`,
          })
        }
        return true
      } catch (error) {
        toast.error(
          'Suppression impossible',
          error instanceof Error ? error.message : 'Une erreur est survenue.',
        )
        return false
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, can, logAudit, clients],
  )

  return {
    clients,
    loading,
    saving,
    fetchClients,
    createClient,
    updateClient,
    removeClient,
  }
}
