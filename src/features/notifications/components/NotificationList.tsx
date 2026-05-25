import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Archive, Check, Trash2 } from 'lucide-react'
import type { ActivityFeedItem } from '@/types/entities'
import {
  getFeedKindIcon,
  getFeedSeverityStyle,
} from '@/features/notifications/utils/feed-labels'
import { formatFeedTime } from '@/features/notifications/utils/relative-time'
import { cn } from '@/utils/cn'

type NotificationListProps = {
  items: ActivityFeedItem[]
  onMarkRead: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function NotificationList({
  items,
  onMarkRead,
  onArchive,
  onDelete,
}: NotificationListProps) {
  const visible = items.filter((item) => !item.archived)

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm font-medium text-text-primary">Tout est à jour</p>
        <p className="mt-1 text-xs text-text-muted">Aucune notification en attente.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-2">
      {visible.map((item, index) => {
        const Icon = getFeedKindIcon(item.kind)
        const colorClass = getFeedSeverityStyle(item.severity)

        return (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
            className={cn(
              'rounded-xl border border-border/70 bg-surface-hover/15 p-3 transition-colors',
              !item.read && 'border-neon-blue/25 bg-primary-muted/20',
            )}
          >
            <div className="flex gap-3">
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1',
                  colorClass,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  {!item.read ? (
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-neon-blue glow-blue" />
                  ) : null}
                </div>
                {item.message ? (
                  <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{item.message}</p>
                ) : null}
                <p className="mt-1 text-[10px] text-text-muted">{formatFeedTime(item.createdAt)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {item.href ? (
                    <Link to={item.href} className="text-xs font-medium text-neon-blue hover:underline">
                      Voir
                    </Link>
                  ) : null}
                  {!item.read ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
                      onClick={() => onMarkRead(item.id)}
                    >
                      <Check className="size-3" />
                      Lu
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
                    onClick={() => onArchive(item.id)}
                  >
                    <Archive className="size-3" />
                    Archiver
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-danger hover:underline"
                    onClick={() => onDelete(item.id)}
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
