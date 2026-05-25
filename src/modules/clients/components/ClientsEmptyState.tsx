import { motion } from 'framer-motion'
import { Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fadeInUp } from '@/utils/motion'

type ClientsEmptyStateProps = {
  hasFilters: boolean
  onCreateClick: () => void
  onClearFilters?: () => void
}

export function ClientsEmptyState({
  hasFilters,
  onCreateClick,
  onClearFilters,
}: ClientsEmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-muted ring-1 ring-neon-blue/20">
        <Users className="size-7 text-neon-blue" />
      </div>

      <h3 className="text-base font-semibold text-text-primary">
        {hasFilters ? 'Aucun client trouvé' : 'Aucun client pour le moment'}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        {hasFilters
          ? 'Essayez de modifier vos filtres ou votre recherche.'
          : 'Commencez par ajouter votre premier client au carnet d\'adresses.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Réinitialiser les filtres
          </Button>
        ) : null}
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouveau client
        </Button>
      </div>
    </motion.div>
  )
}
