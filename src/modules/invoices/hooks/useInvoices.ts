import { useCallback, useEffect, useState } from 'react'
import { invoicesRepository } from '@/services/database/repositories/invoices.repository'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { handleDocumentStockTransition } from '@/modules/inventory/services/stock.service'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '@/types/entities'

type InvoicePayload = Omit<InvoiceInsert, 'userId' | 'number'>

export function useInvoices() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invoicesRepository.list()
      setInvoices(data)
    } catch (error) {
      toast.error('Chargement impossible', formatSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchInvoices()
  }, [fetchInvoices])

  const createInvoice = useCallback(
    async (payload: InvoicePayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer une facture.')
        return null
      }

      setSaving(true)
      try {
        const invoice = await invoicesRepository.create({ ...payload, userId })
        setInvoices((prev) => [invoice, ...prev])
        await refreshSync()
        toast.success('Facture créée', invoice.number)
        return invoice
      } catch (error) {
        toast.error('Création impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  const updateInvoice = useCallback(
    async (id: string, payload: InvoiceUpdate) => {
      if (!userId) return null
      const existing = invoices.find((item) => item.id === id)
      setSaving(true)
      try {
        const invoice = await invoicesRepository.update(id, payload)
        const prevLines = existing?.lines ?? []
        const nextLines = invoice.lines
        const wasDeducting = existing?.status === 'paid'
        const isDeducting = invoice.status === 'paid'
        try {
          await handleDocumentStockTransition(prevLines, nextLines, wasDeducting, isDeducting, userId, {
            referenceType: 'invoice',
            referenceId: id,
            movementType: 'invoice',
          })
        } catch (stockError) {
          toast.error('Stock', formatSupabaseError(stockError))
        }
        setInvoices((prev) => prev.map((item) => (item.id === id ? invoice : item)))
        await refreshSync()
        toast.success('Facture mise à jour', invoice.number)
        return invoice
      } catch (error) {
        toast.error('Mise à jour impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [invoices, refreshSync, userId],
  )

  const removeInvoice = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await invoicesRepository.remove(id)
        setInvoices((prev) => prev.filter((item) => item.id !== id))
        await refreshSync()
        toast.success('Facture supprimée')
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
    invoices,
    loading,
    saving,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    removeInvoice,
  }
}
