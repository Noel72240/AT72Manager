import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type QuotesEmptyStateProps = {
  hasFilters: boolean
  onCreateClick: () => void
  onClearFilters?: () => void
}

export function QuotesEmptyState({
  hasFilters,
  onCreateClick,
  onClearFilters,
}: QuotesEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-muted">
        <FileText className="size-7 text-neon-blue" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-text-primary">
          {hasFilters ? 'Aucun devis trouvé' : 'Aucun devis'}
        </h3>
        <p className="max-w-sm text-sm text-text-muted">
          {hasFilters
            ? 'Modifiez vos filtres ou créez un nouveau devis professionnel.'
            : 'Créez votre premier devis depuis un client, une intervention ou un appareil.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {hasFilters && onClearFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Réinitialiser les filtres
          </Button>
        ) : null}
        <Button leftIcon={<Plus className="size-4" />} onClick={onCreateClick}>
          Nouveau devis
        </Button>
      </div>
    </div>
  )
}
