import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, Sparkles, TrendingUp, Warehouse } from 'lucide-react'
import { useStockDashboard } from '@/modules/stock/hooks/useStockDashboard'
import { StockAlertsPanel } from '@/modules/stock/components/StockAlertsPanel'
import { StockMovementsTable } from '@/modules/stock/components/StockMovementsTable'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/modules/commercial/utils/format-price'
import { ROUTES } from '@/config/routes'
import { fadeInUp, staggerContainer } from '@/utils/motion'

export function StockPage() {
  const { loading, metrics, partsById, refresh } = useStockDashboard()

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
        <TableSkeleton rows={8} />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8"
    >
      <motion.header variants={fadeInUp} className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Centre de contrôle <span className="gradient-text">Stock</span>
          </h2>
          <p className="text-sm text-text-secondary">
            Alertes, mouvements, rentabilité et valorisation inventaire.
          </p>
        </div>
        <Link
          to={ROUTES.PARTS}
          className="text-sm font-medium text-neon-blue hover:underline"
        >
          Catalogue pièces →
        </Link>
      </motion.header>

      <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          stat={{
            id: 'parts',
            label: 'Références',
            value: metrics.totalParts,
            format: 'number',
            icon: Package,
            accent: 'blue',
            hint: `${metrics.totalUnits} unités en stock`,
          }}
        />
        <StatCard
          stat={{
            id: 'inventory',
            label: 'Valeur achat',
            value: metrics.inventoryValue,
            format: 'currency',
            icon: Warehouse,
            accent: 'blue',
          }}
        />
        <StatCard
          stat={{
            id: 'margin',
            label: 'Marge potentielle',
            value: metrics.totalMargin,
            format: 'currency',
            icon: TrendingUp,
            accent: 'green',
            hint: 'Sur stock actuel',
          }}
        />
        <StatCard
          stat={{
            id: 'out',
            label: 'Sorties enregistrées',
            value: metrics.partsUsedOut,
            format: 'number',
            icon: TrendingUp,
            accent: 'green',
            hint: `${metrics.movementsCount} mouvements`,
          }}
        />
      </motion.div>

      <motion.div variants={fadeInUp} className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <StockAlertsPanel alerts={metrics.alerts} />
          <Card className="p-4 space-y-2">
            <p className="text-sm font-semibold text-text-primary">Résumé alertes</p>
            <p className="text-xs text-text-muted">
              {metrics.lowStockCount} stock faible · {metrics.outOfStockCount} rupture
            </p>
            <p className="text-xs text-text-muted">
              CA potentiel stock : {formatPrice(metrics.potentialRevenue)}
            </p>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <StockMovementsTable movements={metrics.recentMovements} partsById={partsById} />
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/80 px-4 py-3"
      >
        <Sparkles className="size-4 text-neon-blue" />
        <span className="text-sm text-text-secondary">À venir</span>
        <Badge variant="default">Scan code-barres</Badge>
        <Badge variant="default">OCR facture fournisseur</Badge>
        <Badge variant="default">IA prévision stock</Badge>
        <Badge variant="default">Commandes auto</Badge>
        <button
          type="button"
          className="ml-auto text-xs text-neon-blue hover:underline"
          onClick={() => void refresh()}
        >
          Actualiser
        </button>
      </motion.div>
    </motion.div>
  )
}
