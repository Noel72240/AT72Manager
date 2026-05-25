import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type PartsEmptyStateProps = {
  hasFilters: boolean
  onCreateClick: () => void
  onClearFilters?: () => void
}

export function PartsEmptyState({ hasFilters, onCreateClick, onClearFilters }: PartsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-muted">
        <Package className="size-7 text-neon-blue" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">
        {hasFilters ? 'Aucune pièce trouvée' : 'Catalogue vide'}
      </h3>
      <p className="max-w-sm text-sm text-text-muted">
        Gérez vos pièces détachées, marges et seuils de réapprovisionnement.
      </p>
      <div className="flex gap-2">
        {hasFilters && onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Réinitialiser
          </Button>
        ) : null}
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouvelle pièce
        </Button>
      </div>
    </div>
  )
}
