import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useFeedStore } from '@/store/feed.store'
import { cn } from '@/utils/cn'

export function NotificationBell() {
  const unreadCount = useFeedStore((state) => state.unreadCount)
  const togglePanel = useFeedStore((state) => state.togglePanel)

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => togglePanel()}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-lg border border-border-subtle',
        'bg-surface-elevated/60 text-text-secondary transition-colors',
        'hover:border-neon-blue/20 hover:text-text-primary',
      )}
      aria-label={
        unreadCount > 0
          ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
          : 'Notifications'
      }
    >
      <Bell className="size-[17px]" strokeWidth={1.75} />
      {unreadCount > 0 ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -top-0.5 flex min-w-[1.125rem] items-center justify-center rounded-full bg-neon-green px-1 py-0.5 text-[9px] font-bold text-background glow-green"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.span>
      ) : (
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-neon-green/40" />
      )}
    </motion.button>
  )
}
