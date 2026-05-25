import { useCallback, useEffect, useMemo, useState } from 'react'
import { sparePartsRepository } from '@/services/database/repositories/spare-parts.repository'
import { stockMovementsRepository } from '@/services/database/repositories/stock-movements.repository'
import { computeStockDashboardMetrics } from '@/modules/stock/utils/stock-metrics'
import type { SparePart, StockMovement } from '@/types/entities'

export function useStockDashboard() {
  const [loading, setLoading] = useState(true)
  const [parts, setParts] = useState<SparePart[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [partsData, movementsData] = await Promise.all([
        sparePartsRepository.list(),
        stockMovementsRepository.list(),
      ])
      setParts(partsData)
      setMovements(movementsData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const metrics = useMemo(
    () => computeStockDashboardMetrics(parts, movements),
    [parts, movements],
  )

  const partsById = useMemo(() => new Map(parts.map((p) => [p.id, p])), [parts])

  return { loading, parts, movements, metrics, partsById, refresh: fetchData }
}
