import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, CheckCheck, Sparkles, X } from 'lucide-react'
import { useFeedStore } from '@/store/feed.store'
import { NotificationList } from '@/features/notifications/components/NotificationList'
import { ActivityTimeline } from '@/features/notifications/components/ActivityTimeline'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ROUTES } from '@/config/routes'
import { cn } from '@/utils/cn'

type TabId = 'notifications' | 'activity'

export function NotificationCenter() {
  const location = useLocation()
  const panelOpen = useFeedStore((state) => state.panelOpen)
  const setPanelOpen = useFeedStore((state) => state.setPanelOpen)
  const items = useFeedStore((state) => state.items)
  const loading = useFeedStore((state) => state.loading)
  const unreadCount = useFeedStore((state) => state.unreadCount)
  const markRead = useFeedStore((state) => state.markRead)
  const markAllRead = useFeedStore((state) => state.markAllRead)
  const archive = useFeedStore((state) => state.archive)
  const remove = useFeedStore((state) => state.remove)
  const load = useFeedStore((state) => state.load)

  const [tab, setTab] = useState<TabId>('notifications')

  useEffect(() => {
    setPanelOpen(false)
  }, [location.pathname, setPanelOpen])

  const notificationItems = useMemo(
    () => items.filter((item) => !item.archived),
    [items],
  )

  const activityItems = useMemo(
    () => items.filter((item) => !item.archived).slice(0, 40),
    [items],
  )

  if (!panelOpen) {
    return null
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer le panneau"
        className="fixed inset-y-0 right-0 left-0 z-40 bg-background/60 backdrop-blur-sm lg:left-[260px]"
        onClick={() => setPanelOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Centre de notifications"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-surface-elevated shadow-card glass-elevated"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-neon-blue" />
              <h2 className="text-lg font-semibold text-text-primary">Centre d&apos;activité</h2>
              {unreadCount > 0 ? (
                <Badge variant="primary">{unreadCount}</Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              Notifications intelligentes & timeline atelier
            </p>
          </div>
          <Button variant="ghost" size="sm" aria-label="Fermer" onClick={() => setPanelOpen(false)}>
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex gap-1 border-b border-border px-4 pt-2">
          {(
            [
              { id: 'notifications' as const, label: 'Notifications' },
              { id: 'activity' as const, label: 'Activité' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'relative px-3 py-2.5 text-sm font-medium transition-colors',
                tab === item.id ? 'text-neon-blue' : 'text-text-muted hover:text-text-primary',
              )}
            >
              {item.label}
              {item.id === 'notifications' && unreadCount > 0 ? (
                <span className="ml-1.5 inline-flex min-w-[1.125rem] justify-center rounded-full bg-neon-blue px-1 text-[10px] font-bold text-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
              {tab === item.id ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-neon-blue" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<CheckCheck className="size-3.5" />}
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
          >
            Tout marquer lu
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void load()}>
            Actualiser
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-text-muted">Chargement…</p>
          ) : tab === 'notifications' ? (
            <NotificationList
              items={notificationItems}
              onMarkRead={(id) => void markRead(id)}
              onArchive={(id) => void archive(id)}
              onDelete={(id) => void remove(id)}
            />
          ) : (
            <ActivityTimeline
              items={activityItems}
              onArchive={(id) => void archive(id)}
              onDelete={(id) => void remove(id)}
            />
          )}
        </div>

        <footer className="space-y-2 border-t border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border/70 px-3 py-2 text-xs text-text-muted">
            <Sparkles className="size-3.5 text-neon-blue" />
            Push desktop, e-mail & IA alertes — bientôt
          </div>
          <Link
            to={ROUTES.ACTIVITY}
            className="block text-center text-xs font-medium text-neon-blue hover:underline"
            onClick={() => setPanelOpen(false)}
          >
            Vue activité complète →
          </Link>
        </footer>
      </aside>
    </>
  )
}
