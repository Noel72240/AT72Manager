import { motion } from 'framer-motion'
import { Clock, Wifi, WifiOff } from 'lucide-react'
import { fadeInDown } from '@/utils/motion'
import { useLiveClock } from '@/hooks/useLiveClock'
import { cn } from '@/utils/cn'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { AiAssistantButton } from '@/modules/ai/components/AiAssistantButton'
import { UserProfilePanel } from '@/modules/users/components/UserProfilePanel'
import { useSyncStore } from '@/store'

type TopbarProps = {
  title?: string
  className?: string
}

function getConnectionLabel(mode: 'online' | 'offline' | 'degraded') {
  if (mode === 'offline') return 'Hors ligne'
  if (mode === 'degraded') return 'Sync en attente'
  return 'En ligne'
}

export function Topbar({ title = 'Tableau de bord', className }: TopbarProps) {
  const { time, date } = useLiveClock()
  const { mode, pendingCount, failedCount, isOnline } = useSyncStore()
  const syncBacklog = pendingCount + failedCount

  return (
    <motion.header
      variants={fadeInDown}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative flex h-[60px] shrink-0 items-center justify-between border-b border-border px-6 glass',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[15px] font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-0.5 text-xs capitalize text-text-muted">{date}</p>
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          className={cn(
            'hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex',
            isOnline
              ? 'border-neon-green/20 bg-accent-muted/40 text-neon-green'
              : 'border-warning/20 bg-warning/10 text-warning',
          )}
          title={
            syncBacklog > 0
              ? failedCount > 0
                ? `${failedCount} échec(s) · ${pendingCount} en attente`
                : `${pendingCount} modification(s) en attente de sync`
              : undefined
          }
        >
          {isOnline ? (
            <Wifi className="size-3.5" strokeWidth={1.75} />
          ) : (
            <WifiOff className="size-3.5" strokeWidth={1.75} />
          )}
          <span className="text-xs font-medium">{getConnectionLabel(mode)}</span>
        </motion.div>

        <div className="hidden items-center gap-2 rounded-lg border border-border-subtle bg-surface-elevated/60 px-3 py-1.5 sm:flex">
          <Clock className="size-3.5 text-neon-blue" strokeWidth={1.75} />
          <time className="font-mono text-xs tabular-nums text-text-secondary">{time}</time>
        </div>

        <NotificationBell />
        <AiAssistantButton />
        <UserProfilePanel />
      </div>
    </motion.header>
  )
}
