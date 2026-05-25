import type { Invoice, Intervention, Quote, SparePart } from '@/types/entities'
import type { InterventionStatus } from '@/types/entities/intervention.types'

export type BusinessKpi = {
  id: string
  label: string
  value: number
  format: 'number' | 'currency' | 'percent' | 'duration'
  hint?: string
  trend?: 'up' | 'down' | 'neutral'
}

export type RevenueTrendPoint = {
  key: string
  label: string
  revenue: number
  interventions: number
}

export type WorkshopLoadPoint = {
  label: string
  scheduled: number
  urgent: number
}

export type BusinessDashboardMetrics = {
  kpis: BusinessKpi[]
  revenueTrend: RevenueTrendPoint[]
  workshopLoad: WorkshopLoadPoint[]
  topIssues: Array<{ label: string; count: number }>
}

const ACTIVE: InterventionStatus[] = ['diagnostic', 'in_progress', 'waiting_parts']

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

function avgRepairHours(interventions: Intervention[]): number {
  const completed = interventions.filter((i) => i.status === 'completed' && i.completedAt && i.scheduledAt)
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, item) => {
    const start = new Date(item.scheduledAt!).getTime()
    const end = new Date(item.completedAt!).getTime()
    return sum + Math.max(0, end - start)
  }, 0)
  return total / completed.length / 3_600_000
}

export function computeBusinessMetrics(
  interventions: Intervention[],
  quotes: Quote[] = [],
  invoices: Invoice[] = [],
  parts: SparePart[] = [],
): BusinessDashboardMetrics {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const monthlyRevenue = (items: Intervention[], ref: Date) =>
    items
      .filter((i) => isSameMonth(i.createdAt, ref))
      .reduce((sum, i) => sum + (i.finalPrice ?? i.estimatedPrice ?? 0), 0)

  const currentRevenue = monthlyRevenue(interventions, now)
  const previousRevenue = monthlyRevenue(interventions, prev)
  const revenueDelta =
    previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0

  const completedMonth = interventions.filter(
    (i) => i.status === 'completed' && isSameMonth(i.createdAt, now),
  ).length

  const partsCostEstimate = parts.reduce(
    (sum, p) => sum + (p.purchasePrice ?? 0) * Math.max(0, p.quantity ?? 0),
    0,
  )
  const marginEstimate = currentRevenue > 0 ? ((currentRevenue - partsCostEstimate * 0.15) / currentRevenue) * 100 : 0

  const savReturns = interventions.filter((i) => i.status === 'returned').length
  const avgHours = avgRepairHours(interventions)

  const kpis: BusinessKpi[] = [
    {
      id: 'monthly-revenue',
      label: 'CA mensuel',
      value: currentRevenue,
      format: 'currency',
      hint: `${revenueDelta >= 0 ? '+' : ''}${revenueDelta.toFixed(0)}% vs mois préc.`,
      trend: revenueDelta >= 0 ? 'up' : 'down',
    },
    {
      id: 'completed-month',
      label: 'Interventions terminées',
      value: completedMonth,
      format: 'number',
      hint: 'Ce mois-ci',
    },
    {
      id: 'avg-repair-time',
      label: 'Temps moyen réparation',
      value: avgHours,
      format: 'duration',
      hint: 'Sur dossiers clôturés',
    },
    {
      id: 'margin-estimate',
      label: 'Marge estimée',
      value: marginEstimate,
      format: 'percent',
      hint: 'Pièces + main d’œuvre',
    },
    {
      id: 'active-load',
      label: 'Charge atelier',
      value: interventions.filter((i) => ACTIVE.includes(i.status)).length,
      format: 'number',
      hint: 'Dossiers actifs',
    },
    {
      id: 'quotes-open',
      label: 'Devis en cours',
      value: quotes.filter((q) => q.status === 'draft' || q.status === 'sent').length,
      format: 'number',
    },
    {
      id: 'invoices-unpaid',
      label: 'Factures ouvertes',
      value: invoices.filter((i) => i.status !== 'paid').length,
      format: 'number',
    },
    {
      id: 'sav-returns',
      label: 'Retours SAV',
      value: savReturns,
      format: 'number',
    },
  ]

  const revenueTrend: RevenueTrendPoint[] = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = monthKey(date)
    const label = date.toLocaleDateString('fr-FR', { month: 'short' })
    const monthItems = interventions.filter((i) => isSameMonth(i.createdAt, date))
    revenueTrend.push({
      key,
      label,
      revenue: monthItems.reduce((s, i) => s + (i.finalPrice ?? i.estimatedPrice ?? 0), 0),
      interventions: monthItems.length,
    })
  }

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const workshopLoad: WorkshopLoadPoint[] = dayLabels.map((label, index) => {
    const scheduled = interventions.filter((i) => {
      if (!i.scheduledAt) return false
      const d = new Date(i.scheduledAt)
      const day = d.getDay() === 0 ? 6 : d.getDay() - 1
      return day === index
    }).length
    const urgent = interventions.filter((i) => {
      if (!i.scheduledAt || i.priority !== 'urgent') return false
      const d = new Date(i.scheduledAt)
      const day = d.getDay() === 0 ? 6 : d.getDay() - 1
      return day === index
    }).length
    return { label, scheduled, urgent }
  })

  const issueMap = new Map<string, number>()
  for (const item of interventions) {
    const key = item.reportedIssue.slice(0, 40).trim() || 'Autre'
    issueMap.set(key, (issueMap.get(key) ?? 0) + 1)
  }
  const topIssues = [...issueMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({ label, count }))

  return { kpis, revenueTrend, workshopLoad, topIssues }
}
