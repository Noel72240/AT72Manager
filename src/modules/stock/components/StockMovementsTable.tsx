import type { SparePart, StockMovement } from '@/types/entities'
import { Card } from '@/components/ui/Card'

type StockMovementsTableProps = {
  movements: StockMovement[]
  partsById: Map<string, SparePart>
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StockMovementsTable({ movements, partsById }: StockMovementsTableProps) {
  if (movements.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-text-muted">
        Aucun mouvement enregistré pour le moment.
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Historique des mouvements</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 text-xs uppercase text-text-muted">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Pièce</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Variation</th>
              <th className="px-4 py-2">Stock après</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => {
              const part = partsById.get(m.partId)
              return (
                <tr key={m.id} className="border-b border-border/40">
                  <td className="px-4 py-2.5 text-text-secondary">{formatDate(m.createdAt)}</td>
                  <td className="px-4 py-2.5 font-medium">{part?.name ?? m.partId.slice(0, 8)}</td>
                  <td className="px-4 py-2.5 text-text-muted">{m.movementType}</td>
                  <td
                    className={`px-4 py-2.5 font-semibold ${m.delta >= 0 ? 'text-neon-green' : 'text-danger'}`}
                  >
                    {m.delta >= 0 ? '+' : ''}
                    {m.delta}
                  </td>
                  <td className="px-4 py-2.5">{m.quantityAfter}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
