import { motion } from 'framer-motion'
import { StatCard } from '@/components/ui/StatCard'
import type { DashboardStat } from '@/types/dashboard/dashboard.types'
import { staggerContainer } from '@/utils/motion'

type StatCardsGridProps = {
  stats: DashboardStat[]
}

export function StatCardsGrid({ stats }: StatCardsGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </motion.div>
  )
}
