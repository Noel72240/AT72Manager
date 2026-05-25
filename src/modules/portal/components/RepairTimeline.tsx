import { motion } from 'framer-motion'
import { Check, Circle, Loader2 } from 'lucide-react'
import type { PortalRepairTimelineStep } from '@/types/portal.types'
import { cn } from '@/utils/cn'

type RepairTimelineProps = {
  steps: PortalRepairTimelineStep[]
  progress: number
  compact?: boolean
}

export function RepairTimeline({ steps, progress, compact }: RepairTimelineProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-primary">Suivi réparation</p>
        <span className="text-xs tabular-nums text-neon-blue">{progress}%</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-green"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <ol className={cn('space-y-0', compact && 'max-h-64 overflow-y-auto pr-1')}>
        {steps.map((step, index) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {index < steps.length - 1 ? (
              <span
                className={cn(
                  'absolute left-[15px] top-8 h-[calc(100%-8px)] w-px',
                  step.status === 'done' ? 'bg-neon-blue/50' : 'bg-border',
                )}
                aria-hidden
              />
            ) : null}

            <div
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border',
                step.status === 'done' && 'border-neon-green/50 bg-neon-green/15 text-neon-green',
                step.status === 'active' && 'border-neon-blue/60 bg-neon-blue/15 text-neon-blue',
                step.status === 'pending' && 'border-border bg-surface text-text-muted',
              )}
            >
              {step.status === 'done' ? (
                <Check className="size-4" />
              ) : step.status === 'active' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Circle className="size-3" />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' ? 'text-text-muted' : 'text-text-primary',
                )}
              >
                {step.label}
              </p>
              {step.description ? (
                <p className="mt-0.5 text-xs text-text-secondary">{step.description}</p>
              ) : null}
              {step.at ? (
                <p className="mt-1 text-[11px] text-text-muted">
                  {new Date(step.at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  )
}
