import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import type { AiCapability } from '@/services/ai/types'
import { AI_QUICK_ACTIONS } from '@/modules/ai/constants/ai-capabilities'
import { cn } from '@/utils/cn'

type AiQuickActionsProps = {
  disabled?: boolean
  activeCapability?: AiCapability | null
  onAction: (capability: AiCapability) => void
  compact?: boolean
}

export function AiQuickActions({
  disabled,
  activeCapability,
  onAction,
  compact,
}: AiQuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2')}
    >
      {AI_QUICK_ACTIONS.map((action, index) => {
        const Icon = action.icon
        const isActive = activeCapability === action.capability
        return (
          <motion.button
            key={action.capability}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ scale: disabled || isActive ? 1 : 1.02, y: disabled || isActive ? 0 : -1 }}
            whileTap={{ scale: disabled || isActive ? 1 : 0.98 }}
            disabled={disabled || isActive}
            onClick={() => onAction(action.capability)}
            className={cn(
              'group flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
              isActive
                ? 'border-neon-blue/40 bg-neon-blue/10'
                : 'border-border/80 bg-surface-hover/30 hover:border-neon-blue/25 hover:bg-neon-blue/5',
              'disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            <span
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 transition',
                isActive
                  ? 'bg-neon-blue/20 text-neon-blue ring-neon-blue/30'
                  : 'bg-neon-blue/10 text-neon-blue ring-neon-blue/20 group-hover:bg-neon-blue/15',
              )}
            >
              {isActive ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" strokeWidth={1.75} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-text-primary">{action.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-text-muted">
                {isActive ? 'Génération en cours…' : action.description}
              </span>
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
