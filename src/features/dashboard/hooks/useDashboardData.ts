import { useCallback, useEffect, useMemo, useState } from 'react'
import { clientsRepository } from '@/services/database/repositories/clients.repository'
import { interventionsRepository } from '@/services/database/repositories/interventions.repository'
import { devicesRepository } from '@/services/database/repositories/devices.repository'
import { sparePartsRepository } from '@/services/database/repositories/spare-parts.repository'
import { quotesRepository } from '@/services/database/repositories/quotes.repository'
import { invoicesRepository } from '@/services/database/repositories/invoices.repository'
import { computeDashboardMetrics } from '@/features/dashboard/utils/dashboard-metrics'
import { computeBusinessMetrics } from '@/features/dashboard/utils/business-metrics'
import { useSyncStore } from '@/store/sync.store'
import type { Client, Device, Intervention, Invoice, Quote, SparePart } from '@/types/entities'
import type { DashboardMetrics } from '@/types/dashboard/dashboard.types'
import type { BusinessDashboardMetrics } from '@/features/dashboard/utils/business-metrics'

export function useDashboardData() {
  const pendingCount = useSyncStore((state) => state.pendingCount)
  const failedCount = useSyncStore((state) => state.failedCount)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [parts, setParts] = useState<SparePart[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [clientsData, interventionsData, devicesData, partsData, quotesData, invoicesData] =
        await Promise.all([
          clientsRepository.list(),
          interventionsRepository.list(),
          devicesRepository.list(),
          sparePartsRepository.list(),
          quotesRepository.list(),
          invoicesRepository.list(),
        ])
      setClients(clientsData)
      setInterventions(interventionsData)
      setDevices(devicesData)
      setParts(partsData)
      setQuotes(quotesData)
      setInvoices(invoicesData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger le tableau de bord.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const metrics: DashboardMetrics = useMemo(
    () => computeDashboardMetrics(clients, interventions, devices, pendingCount + failedCount, parts),
    [clients, interventions, devices, pendingCount, failedCount, parts],
  )

  const businessMetrics: BusinessDashboardMetrics = useMemo(
    () => computeBusinessMetrics(interventions, quotes, invoices, parts),
    [interventions, quotes, invoices, parts],
  )

  return {
    loading,
    error,
    clients,
    interventions,
    devices,
    metrics,
    businessMetrics,
    refresh: fetchData,
  }
}
