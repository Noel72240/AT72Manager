import { motion } from 'framer-motion'
import { Cpu, Sparkles, UserRound, Wrench } from 'lucide-react'
import { useAiStore } from '@/store/ai.store'
import { Badge } from '@/components/ui/Badge'

export function AiContextBanner() {
  const contextBinding = useAiStore((state) => state.contextBinding)
  const providerLabel = useAiStore((state) => state.providerLabel)

  if (!contextBinding) return null

  const { context, label } = contextBinding

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="border-b border-border/80 bg-linear-to-r from-neon-blue/5 via-transparent to-neon-green/5 px-5 py-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Sparkles className="size-4 text-neon-blue" />
        <span className="text-xs font-semibold text-text-primary">Contexte actif</span>
        <Badge variant="primary">{label}</Badge>
        <Badge variant="default">{providerLabel}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-text-muted">
        {context.client ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover/60 px-2 py-1">
            <UserRound className="size-3" />
            {context.client.name}
          </span>
        ) : null}
        {context.device ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover/60 px-2 py-1">
            <Cpu className="size-3" />
            {[context.device.brand, context.device.model].filter(Boolean).join(' ')}
          </span>
        ) : null}
        {context.intervention ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover/60 px-2 py-1">
            <Wrench className="size-3" />
            {context.intervention.reportedIssue.slice(0, 48)}
            {context.intervention.reportedIssue.length > 48 ? '…' : ''}
          </span>
        ) : null}
      </div>
    </motion.div>
  )
}
