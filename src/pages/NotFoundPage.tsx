import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { Card } from '@/components/ui/Card'
import { fadeInUp } from '@/utils/motion'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[960px] items-center justify-center p-6">
      <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="w-full">
        <Card
          title="Page introuvable"
          description="La page demandée n'existe pas ou a été déplacée."
          hover
        >
          <Link
            to={ROUTES.DASHBOARD}
            className="inline-flex items-center rounded-lg bg-primary-muted px-3 py-2 text-sm font-medium text-neon-blue ring-1 ring-neon-blue/20 hover:bg-primary-muted/70"
          >
            Retour au tableau de bord
          </Link>
        </Card>
      </motion.div>
    </div>
  )
}
