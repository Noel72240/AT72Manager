import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import type { StockAlert } from '@/modules/stock/utils/stock-metrics'
import { ROUTES } from '@/config/routes'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

type StockAlertsPanelProps = {
  alerts: StockAlert[]
}

export function StockAlertsPanel({ alerts }: StockAlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card className="p-4">
        <p className="text-sm text-text-muted">Aucune alerte stock — tous les seuils sont OK.</p>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="border-b border-border/60 px-4 py-3 flex items-center gap-2">
        <AlertTriangle className="size-4 text-warning" />
        <h3 className="text-sm font-semibold text-text-primary">Alertes rupture & stock faible</h3>
      </div>
      <ul className="divide-y divide-border/50">
        {alerts.map((alert) => (
          <li key={alert.id} className="px-4 py-3 hover:bg-surface-hover/30">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-text-primary">{alert.title}</p>
                <p className="mt-0.5 text-xs text-text-muted">{alert.description}</p>
              </div>
              <Badge variant={alert.severity === 'danger' ? 'danger' : 'warning'}>
                {alert.severity === 'danger' ? 'Rupture' : 'Faible'}
              </Badge>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border/60 px-4 py-2">
        <Link to={ROUTES.PARTS} className="text-xs font-medium text-neon-blue hover:underline">
          Gérer le catalogue pièces →
        </Link>
      </div>
    </Card>
  )
}
