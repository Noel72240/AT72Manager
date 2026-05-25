import { useEffect, useMemo } from 'react'
import { ActivityTimeline } from '@/features/notifications/components/ActivityTimeline'
import { useFeedStore } from '@/store/feed.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TableSkeleton } from '@/components/ui/Skeleton'

export function ActivityPage() {
  const items = useFeedStore((state) => state.items)
  const loading = useFeedStore((state) => state.loading)
  const load = useFeedStore((state) => state.load)
  const archive = useFeedStore((state) => state.archive)
  const remove = useFeedStore((state) => state.remove)
  const markAllRead = useFeedStore((state) => state.markAllRead)

  const visibleItems = useMemo(
    () => items.filter((item) => !item.archived),
    [items],
  )

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="mx-auto max-w-[900px] space-y-6 p-6 lg:p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">
            Activité <span className="gradient-text">atelier</span>
          </h2>
          <p className="text-sm text-text-secondary">
            Timeline complète des événements métier en temps réel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void markAllRead()}>
            Tout lu
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void load()}>
            Actualiser
          </Button>
        </div>
      </header>

      <Card className="p-4">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : (
          <ActivityTimeline
            items={visibleItems}
            onArchive={(id) => void archive(id)}
            onDelete={(id) => void remove(id)}
          />
        )}
      </Card>
    </div>
  )
}
