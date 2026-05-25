import { Plus, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type InvoicesEmptyStateProps = {
  hasFilters: boolean
  onCreateClick: () => void
  onClearFilters?: () => void
}

export function InvoicesEmptyState({
  hasFilters,
  onCreateClick,
  onClearFilters,
}: InvoicesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-accent-muted">
        <Receipt className="size-7 text-neon-green" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">
          {hasFilters ? 'Aucune facture trouvée' : 'Aucune facture'}
        </h3>
        <p className="max-w-sm text-sm text-text-muted">
          {hasFilters
            ? 'Modifiez vos filtres ou créez une facture.'
            : 'Convertissez un devis accepté ou créez une facture directement.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {hasFilters && onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Réinitialiser les filtres
          </Button>
        ) : null}
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouvelle facture
        </Button>
      </div>
    </div>
  )
}
