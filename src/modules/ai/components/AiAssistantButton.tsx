import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import { useAiStore } from '@/store/ai.store'
import { cn } from '@/utils/cn'

export function AiAssistantButton() {
  const togglePanel = useAiStore((state) => state.togglePanel)
  const providerLabel = useAiStore((state) => state.providerLabel)

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={() => togglePanel()}
      className={cn(
        'relative flex size-9 items-center justify-center rounded-lg border border-border-subtle',
        'bg-linear-to-br from-neon-blue/15 to-neon-green/10 text-neon-blue',
        'transition-colors hover:border-neon-blue/30 hover:shadow-[0_0_20px_rgba(56,189,248,0.15)]',
      )}
      aria-label={`Assistant IA — ${providerLabel}`}
      title={providerLabel}
    >
      <Bot className="size-[17px]" strokeWidth={1.75} />
      <motion.span
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-neon-green text-background"
      >
        <Sparkles className="size-2" />
      </motion.span>
    </motion.button>
  )
}
