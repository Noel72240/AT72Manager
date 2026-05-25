import { Link } from 'react-router-dom'
import type { ActivityFeedItem } from '@/types/entities'
import {
  getFeedKindIcon,
  getFeedSeverityStyle,
} from '@/features/notifications/utils/feed-labels'
import { formatFeedTime } from '@/features/notifications/utils/relative-time'
import { cn } from '@/utils/cn'

type ActivityTimelineProps = {
  items: ActivityFeedItem[]
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ActivityTimeline({ items, onArchive, onDelete }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-muted">
        Aucune activité enregistrée pour le moment.
      </p>
    )
  }

  return (
    <ul className="relative space-y-0">
      <div
        aria-hidden
        className="absolute left-[1.125rem] top-2 bottom-2 w-px bg-border/80"
      />
      {items.map((item) => {
        const Icon = getFeedKindIcon(item.kind)
        const colorClass = getFeedSeverityStyle(item.severity)

        return (
          <li
            key={item.id}
            className="relative flex gap-3 py-3 pl-1"
          >
            <div
              className={cn(
                'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
                colorClass,
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-text-primary">{item.title}</p>
                <time className="shrink-0 text-[10px] text-text-muted">
                  {formatFeedTime(item.createdAt)}
                </time>
              </div>
              {item.message ? (
                <p className="mt-0.5 text-xs text-text-secondary line-clamp-2">{item.message}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-xs font-medium text-neon-blue hover:underline"
                  >
                    Ouvrir
                  </Link>
                ) : null}
                {onArchive ? (
                  <button
                    type="button"
                    className="text-xs text-text-muted hover:text-text-primary"
                    onClick={() => onArchive(item.id)}
                  >
                    Archiver
                  </button>
                ) : null}
                {onDelete ? (
                  <button
                    type="button"
                    className="text-xs text-danger hover:underline"
                    onClick={() => onDelete(item.id)}
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
