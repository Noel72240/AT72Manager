import type { LucideIcon } from 'lucide-react'
import type { InterventionStatus } from '@/types/entities/intervention.types'

export type StatTrend = 'up' | 'down' | 'neutral'

export type DashboardStat = {
  id: string
  label: string
  value: number
  format: 'number' | 'currency'
  icon: LucideIcon
  accent: 'blue' | 'green'
  hint?: string
  change?: number
  trend?: StatTrend
}

export type ActivityType = 'intervention' | 'client' | 'device' | 'sync' | 'alert'

export type ActivityItem = {
  id: string
  title: string
  description: string
  time: string
  type: ActivityType
  createdAt: string
}

export type StatusChartItem = {
  status: InterventionStatus
  label: string
  count: number
  colorClass: string
}

export type MonthlyChartPoint = {
  key: string
  label: string
  count: number
}

export type DashboardAlert = {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'danger'
  href?: string
}

export type RecentInterventionRow = {
  id: string
  clientName: string
  summary: string
  status: InterventionStatus
  createdAt: string
}

export type RecentClientRow = {
  id: string
  name: string
  phone?: string
  createdAt: string
}

export type RecentDeviceRow = {
  id: string
  clientName: string
  summary: string
  condition: string
  createdAt: string
}

export type DashboardMetrics = {
  stats: DashboardStat[]
  statusChart: StatusChartItem[]
  monthlyChart: MonthlyChartPoint[]
  activity: ActivityItem[]
  alerts: DashboardAlert[]
  recentInterventions: RecentInterventionRow[]
  recentClients: RecentClientRow[]
  recentDevices: RecentDeviceRow[]
}
