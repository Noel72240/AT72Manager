import { ClipboardList, Cpu, TrendingUp, Users } from 'lucide-react'
import type { Client, Device, SparePart } from '@/types/entities'
import { getStockLevel } from '@/modules/inventory/utils/stock-level'
import type { Intervention, InterventionStatus } from '@/types/entities/intervention.types'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import { getDeviceSummary } from '@/modules/interventions/utils/intervention-labels'
import { STATUS_LABELS } from '@/modules/interventions/utils/intervention-labels'
import { CONDITION_LABELS } from '@/modules/devices/utils/device-labels'
import { formatRelativeTime } from '@/features/dashboard/utils/relative-time'
import type {
  ActivityItem,
  DashboardAlert,
  DashboardMetrics,
  DashboardStat,
  MonthlyChartPoint,
  RecentClientRow,
  RecentDeviceRow,
  RecentInterventionRow,
  StatusChartItem,
} from '@/types/dashboard/dashboard.types'
import { ROUTES } from '@/config/routes'

const ACTIVE_STATUSES: InterventionStatus[] = ['diagnostic', 'in_progress', 'waiting_parts']
const URGENT_DAYS = 7

const STATUS_COLORS: Record<InterventionStatus, string> = {
  diagnostic: 'from-neon-blue/30 to-neon-blue',
  in_progress: 'from-warning/30 to-warning',
  waiting_parts: 'from-text-muted/40 to-text-muted',
  completed: 'from-neon-green/30 to-neon-green',
  returned: 'from-neon-blue/20 to-neon-blue/60',
}

function sortByDateDesc<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

function buildClientMap(clients: Client[]): Map<string, Client> {
  return new Map(clients.map((client) => [client.id, client]))
}

function computeRevenue(interventions: Intervention[]): number {
  return interventions.reduce((sum, item) => {
    const price = item.finalPrice ?? item.estimatedPrice ?? 0
    return sum + price
  }, 0)
}

function countActiveInterventions(interventions: Intervention[]): number {
  return interventions.filter((item) => ACTIVE_STATUSES.includes(item.status)).length
}

function buildMonthlyChart(interventions: Intervention[]): MonthlyChartPoint[] {
  const now = new Date()
  const points: MonthlyChartPoint[] = []

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('fr-FR', { month: 'short' })
    const count = interventions.filter((item) => {
      const created = new Date(item.createdAt)
      return (
        created.getFullYear() === date.getFullYear() &&
        created.getMonth() === date.getMonth()
      )
    }).length
    points.push({ key, label, count })
  }

  return points
}

function buildStatusChart(interventions: Intervention[]): StatusChartItem[] {
  const statuses: InterventionStatus[] = [
    'diagnostic',
    'in_progress',
    'waiting_parts',
    'completed',
    'returned',
  ]

  return statuses.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: interventions.filter((item) => item.status === status).length,
    colorClass: STATUS_COLORS[status],
  }))
}

function buildAlerts(
  interventions: Intervention[],
  pendingSync: number,
  parts: SparePart[] = [],
): DashboardAlert[] {
  const alerts: DashboardAlert[] = []
  const waitingParts = interventions.filter((item) => item.status === 'waiting_parts').length

  if (waitingParts > 0) {
    alerts.push({
      id: 'waiting-parts',
      title: 'Attente pièce',
      description: `${waitingParts} intervention${waitingParts > 1 ? 's' : ''} en attente de pièces`,
      severity: 'warning',
      href: ROUTES.INTERVENTIONS,
    })
  }

  const urgentThreshold = Date.now() - URGENT_DAYS * 24 * 60 * 60 * 1000
  const urgent = interventions.filter((item) => {
    if (!ACTIVE_STATUSES.includes(item.status)) return false
    return new Date(item.createdAt).getTime() < urgentThreshold
  }).length

  if (urgent > 0) {
    alerts.push({
      id: 'urgent',
      title: 'Interventions urgentes',
      description: `${urgent} dossier${urgent > 1 ? 's' : ''} actif${urgent > 1 ? 's' : ''} depuis plus de ${URGENT_DAYS} jours`,
      severity: 'danger',
      href: ROUTES.INTERVENTIONS,
    })
  }

  if (pendingSync > 0) {
    alerts.push({
      id: 'sync-pending',
      title: 'Synchronisation en attente',
      description: `${pendingSync} modification${pendingSync > 1 ? 's' : ''} à envoyer vers le cloud`,
      severity: 'info',
    })
  }

  const outOfStock = parts.filter((p) => getStockLevel(p) === 'out')
  if (outOfStock.length > 0) {
    alerts.push({
      id: 'stock-out',
      title: 'Ruptures stock',
      description: `${outOfStock.length} pièce${outOfStock.length > 1 ? 's' : ''} en rupture`,
      severity: 'danger',
      href: ROUTES.STOCK,
    })
  }

  const lowStock = parts.filter((p) => getStockLevel(p) === 'low')
  if (lowStock.length > 0) {
    alerts.push({
      id: 'stock-low',
      title: 'Stocks faibles',
      description: `${lowStock.length} référence${lowStock.length > 1 ? 's' : ''} sous le seuil`,
      severity: 'warning',
      href: ROUTES.PARTS,
    })
  }

  return alerts
}

function buildActivity(
  interventions: Intervention[],
  clients: Client[],
  devices: Device[],
  clientMap: Map<string, Client>,
): ActivityItem[] {
  const items: ActivityItem[] = []

  for (const intervention of sortByDateDesc(interventions).slice(0, 8)) {
    const clientName = clientMap.get(intervention.clientId)
      ? getClientFullName(clientMap.get(intervention.clientId)!)
      : 'Client'
    items.push({
      id: `int-${intervention.id}`,
      title: intervention.reportedIssue.slice(0, 48),
      description: `${clientName} · ${STATUS_LABELS[intervention.status]}`,
      time: formatRelativeTime(intervention.createdAt),
      type: 'intervention',
      createdAt: intervention.createdAt,
    })
  }

  for (const client of sortByDateDesc(clients).slice(0, 4)) {
    items.push({
      id: `cli-${client.id}`,
      title: getClientFullName(client),
      description: client.phone ?? client.email ?? 'Nouveau client',
      time: formatRelativeTime(client.createdAt),
      type: 'client',
      createdAt: client.createdAt,
    })
  }

  for (const device of sortByDateDesc(devices).slice(0, 4)) {
    const clientName = clientMap.get(device.clientId)
      ? getClientFullName(clientMap.get(device.clientId)!)
      : 'Client'
    items.push({
      id: `dev-${device.id}`,
      title: getDeviceSummary(device),
      description: clientName,
      time: formatRelativeTime(device.createdAt),
      type: 'device',
      createdAt: device.createdAt,
    })
  }

  return sortByDateDesc(items).slice(0, 10)
}

function buildStats(
  clients: Client[],
  interventions: Intervention[],
  devices: Device[],
): DashboardStat[] {
  const active = countActiveInterventions(interventions)
  const revenue = computeRevenue(interventions)
  const completed = interventions.filter((item) => item.status === 'completed').length

  return [
    {
      id: 'clients',
      label: 'Clients',
      value: clients.length,
      format: 'number',
      icon: Users,
      accent: 'green',
      hint: 'Carnet clients',
    },
    {
      id: 'interventions-active',
      label: 'Interventions actives',
      value: active,
      format: 'number',
      icon: ClipboardList,
      accent: 'blue',
      hint: `${interventions.length} au total`,
    },
    {
      id: 'devices',
      label: 'Appareils enregistrés',
      value: devices.length,
      format: 'number',
      icon: Cpu,
      accent: 'blue',
      hint: 'Parc matériel',
    },
    {
      id: 'revenue',
      label: "CA estimé",
      value: revenue,
      format: 'currency',
      icon: TrendingUp,
      accent: 'green',
      hint: `${completed} terminée${completed !== 1 ? 's' : ''}`,
    },
  ]
}

export function computeDashboardMetrics(
  clients: Client[],
  interventions: Intervention[],
  devices: Device[],
  pendingSync = 0,
  parts: SparePart[] = [],
): DashboardMetrics {
  const clientMap = buildClientMap(clients)

  const recentInterventions: RecentInterventionRow[] = sortByDateDesc(interventions)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      clientName: clientMap.get(item.clientId)
        ? getClientFullName(clientMap.get(item.clientId)!)
        : 'Client inconnu',
      summary: getDeviceSummary(item),
      status: item.status,
      createdAt: item.createdAt,
    }))

  const recentClients: RecentClientRow[] = sortByDateDesc(clients)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: getClientFullName(item),
      phone: item.phone,
      createdAt: item.createdAt,
    }))

  const recentDevices: RecentDeviceRow[] = sortByDateDesc(devices)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      clientName: clientMap.get(item.clientId)
        ? getClientFullName(clientMap.get(item.clientId)!)
        : 'Client inconnu',
      summary: getDeviceSummary(item),
      condition: CONDITION_LABELS[item.condition],
      createdAt: item.createdAt,
    }))

  return {
    stats: buildStats(clients, interventions, devices),
    statusChart: buildStatusChart(interventions),
    monthlyChart: buildMonthlyChart(interventions),
    activity: buildActivity(interventions, clients, devices, clientMap),
    alerts: buildAlerts(interventions, pendingSync, parts),
    recentInterventions,
    recentClients,
    recentDevices,
  }
}
