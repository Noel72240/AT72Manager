import { motion } from 'framer-motion'
import { Plus, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { fadeInUp } from '@/utils/motion'

type DevicesEmptyStateProps = {
  hasFilters: boolean
  onCreateClick: () => void
  onClearFilters?: () => void
}

export function DevicesEmptyState({
  hasFilters,
  onCreateClick,
  onClearFilters,
}: DevicesEmptyStateProps) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary-muted ring-1 ring-neon-blue/20">
        <Smartphone className="size-7 text-neon-blue" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">
        {hasFilters ? 'Aucun appareil trouvé' : 'Aucun appareil enregistré'}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        {hasFilters
          ? 'Essayez de modifier vos filtres ou votre recherche.'
          : 'Enregistrez les appareils de vos clients pour un suivi SAV complet.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {hasFilters && onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Réinitialiser les filtres
          </Button>
        ) : null}
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouvel appareil
        </Button>
      </div>
    </motion.div>
  )
}
