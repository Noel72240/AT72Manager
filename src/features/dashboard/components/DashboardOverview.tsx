import { motion } from 'framer-motion'
import { RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import { DashboardSkeleton } from '@/features/dashboard/components/DashboardSkeleton'
import { DashboardSyncBanner } from '@/features/dashboard/components/DashboardSyncBanner'
import { DashboardAlerts } from '@/features/dashboard/components/DashboardAlerts'
import { StatCardsGrid } from '@/features/dashboard/components/StatCardsGrid'
import { InterventionsByStatusChart } from '@/features/dashboard/components/InterventionsByStatusChart'
import { MonthlyEvolutionChart } from '@/features/dashboard/components/MonthlyEvolutionChart'
import { BusinessCockpitSection } from '@/features/dashboard/components/BusinessCockpitSection'
import { RecentActivityFeed } from '@/features/dashboard/components/RecentActivityFeed'
import { RecentListsSection } from '@/features/dashboard/components/RecentListsSection'
import { useAuthStore } from '@/store/auth.store'
import { fadeInUp, staggerContainer } from '@/utils/motion'

function getGreetingName(fullName?: string | null): string {
  if (!fullName?.trim()) return 'Bienvenue'
  return fullName.trim().split(/\s+/)[0] ?? 'Bienvenue'
}

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user)
  const { loading, error, metrics, businessMetrics, interventions, refresh } = useDashboardData()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
        <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-6 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={() => void refresh()}>
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  const firstName = getGreetingName(user?.fullName)

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8"
    >
      <motion.header
        variants={fadeInUp}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Bonjour, <span className="gradient-text">{firstName}</span>
          </h2>
          <p className="text-sm text-text-secondary">
            Centre de contrôle SAV — données en temps réel de votre atelier.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw className="size-4" />}
          onClick={() => void refresh()}
        >
          Actualiser
        </Button>
      </motion.header>

      <DashboardSyncBanner />
      <DashboardAlerts alerts={metrics.alerts} />
      <StatCardsGrid stats={metrics.stats} />
      <BusinessCockpitSection metrics={businessMetrics} />

      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <MonthlyEvolutionChart points={metrics.monthlyChart} />
        </div>
        <div className="lg:col-span-2">
          <InterventionsByStatusChart
            items={metrics.statusChart}
            total={interventions.length}
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RecentListsSection
            interventions={metrics.recentInterventions}
            clients={metrics.recentClients}
            devices={metrics.recentDevices}
          />
        </div>
        <div className="lg:col-span-2">
          <RecentActivityFeed items={metrics.activity} />
        </div>
      </motion.div>

      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border/80 bg-surface-hover/20 px-4 py-3"
      >
        <Sparkles className="size-4 text-neon-blue" />
        <span className="text-sm text-text-secondary">Cockpit business actif</span>
        <Badge variant="primary" className="opacity-80">
          KPIs atelier
        </Badge>
        <Badge variant="default" className="opacity-80">
          IA & prévisions — bientôt
        </Badge>
      </motion.div>
    </motion.div>
  )
}
