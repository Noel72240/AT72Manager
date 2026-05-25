import { useCallback, useEffect, useState } from 'react'
import { quotesRepository } from '@/services/database/repositories/quotes.repository'
import { invoicesRepository } from '@/services/database/repositories/invoices.repository'
import { useAuthStore } from '@/store/auth.store'
import { useSyncStore } from '@/store/sync.store'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'
import { handleDocumentStockTransition } from '@/modules/inventory/services/stock.service'
import { emitFeedItem } from '@/features/notifications/services/feed.service'
import { ROUTES } from '@/config/routes'
import type { Invoice, Quote, QuoteInsert, QuoteUpdate } from '@/types/entities'

type QuotePayload = Omit<QuoteInsert, 'userId' | 'number'>

export function useQuotes() {
  const userId = useAuthStore((state) => state.user?.id)
  const refreshSync = useSyncStore((state) => state.refresh)

  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const data = await quotesRepository.list()
      setQuotes(data)
    } catch (error) {
      toast.error('Chargement impossible', formatSupabaseError(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchQuotes()
  }, [fetchQuotes])

  const createQuote = useCallback(
    async (payload: QuotePayload) => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour créer un devis.')
        return null
      }

      setSaving(true)
      try {
        const quote = await quotesRepository.create({ ...payload, userId })
        setQuotes((prev) => [quote, ...prev])
        await refreshSync()
        toast.success('Devis créé', quote.number)
        return quote
      } catch (error) {
        toast.error('Création impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  const updateQuote = useCallback(
    async (id: string, payload: QuoteUpdate) => {
      if (!userId) return null
      const existing = quotes.find((item) => item.id === id)
      setSaving(true)
      try {
        const quote = await quotesRepository.update(id, payload)
        const prevLines = existing?.lines ?? []
        const nextLines = quote.lines
        const wasDeducting = existing?.status === 'accepted'
        const isDeducting = quote.status === 'accepted'
        try {
          await handleDocumentStockTransition(prevLines, nextLines, wasDeducting, isDeducting, userId, {
            referenceType: 'quote',
            referenceId: id,
            movementType: 'quote',
          })
        } catch (stockError) {
          toast.error('Stock', formatSupabaseError(stockError))
        }
        setQuotes((prev) => prev.map((item) => (item.id === id ? quote : item)))
        await refreshSync()
        if (quote.status === 'accepted' && existing?.status !== 'accepted') {
          await emitFeedItem(
            userId,
            {
              kind: 'quote_accepted',
              title: `Devis accepté ${quote.number}`,
              message: quote.title ?? 'Prêt pour facturation',
              href: ROUTES.QUOTES,
              entityType: 'quote',
              entityId: quote.id,
              dedupeKey: `quote_accepted:${quote.id}`,
            },
            { toast: true, toastVariant: 'success' },
          )
        }
        toast.success('Devis mis à jour', quote.number)
        return quote
      } catch (error) {
        toast.error('Mise à jour impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [quotes, refreshSync, userId],
  )

  const removeQuote = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await quotesRepository.remove(id)
        setQuotes((prev) => prev.filter((item) => item.id !== id))
        await refreshSync()
        toast.success('Devis supprimé')
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

  const convertToInvoice = useCallback(
    async (quote: Quote): Promise<Invoice | null> => {
      if (!userId) {
        toast.error('Session requise', 'Connectez-vous pour convertir ce devis.')
        return null
      }
      if (quote.convertedInvoiceId) {
        toast.error('Déjà converti', 'Ce devis a déjà une facture associée.')
        return null
      }

      setSaving(true)
      try {
        const invoice = await invoicesRepository.createFromQuote(quote, userId)
        const updatedQuote = await quotesRepository.update(quote.id, {
          convertedInvoiceId: invoice.id,
          status: quote.status === 'draft' ? 'accepted' : quote.status,
        })
        setQuotes((prev) => prev.map((item) => (item.id === quote.id ? updatedQuote : item)))
        await refreshSync()
        toast.success('Facture créée', invoice.number)
        return invoice
      } catch (error) {
        toast.error('Conversion impossible', formatSupabaseError(error))
        return null
      } finally {
        setSaving(false)
      }
    },
    [refreshSync, userId],
  )

  return {
    quotes,
    loading,
    saving,
    fetchQuotes,
    createQuote,
    updateQuote,
    removeQuote,
    convertToInvoice,
  }
}
