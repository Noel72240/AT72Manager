import { motion } from 'framer-motion'
import { Bot, Sparkles } from 'lucide-react'
import type { AiCapability } from '@/services/ai/types'
import { AI_CAPABILITY_LABELS } from '@/modules/ai/constants/ai-capabilities'

type AiThinkingIndicatorProps = {
  capability?: AiCapability | null
}

const THINKING_STEPS = [
  'Lecture du contexte SAV…',
  'Correspondance symptômes / règles atelier…',
  'Génération causes & procédures de test…',
  'Finalisation de la réponse…',
]

export function AiThinkingIndicator({ capability }: AiThinkingIndicatorProps) {
  const label = capability ? AI_CAPABILITY_LABELS[capability] : 'Analyse'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex gap-3"
    >
      <motion.div
        animate={{ rotate: [0, 6, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neon-green/10 text-neon-green ring-1 ring-neon-green/20"
      >
        <Bot className="size-4" />
      </motion.div>

      <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-neon-blue/15 bg-linear-to-r from-neon-blue/8 to-neon-green/5 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
          <Sparkles className="size-3.5 animate-pulse text-neon-blue" />
          {label} en cours…
        </div>
        <div className="mt-2 space-y-1.5">
          {THINKING_STEPS.map((step, index) => (
            <motion.div
              key={step}
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{
                repeat: Infinity,
                duration: 2.4,
                delay: index * 0.45,
                ease: 'easeInOut',
              }}
              className="flex items-center gap-2 text-[11px] text-text-muted"
            >
              <span className="size-1.5 rounded-full bg-neon-green/70" />
              {step}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
