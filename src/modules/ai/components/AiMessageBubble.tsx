import { motion } from 'framer-motion'
import { Bot, User } from 'lucide-react'
import type { AiChatMessage } from '@/services/ai/types'
import { AI_CAPABILITY_LABELS } from '@/modules/ai/constants/ai-capabilities'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

type AiMessageBubbleProps = {
  message: AiChatMessage
}

export function AiMessageBubble({ message }: AiMessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      <motion.div
        whileHover={{ scale: 1.04 }}
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
          isUser
            ? 'bg-neon-blue/15 text-neon-blue ring-neon-blue/25'
            : 'bg-neon-green/10 text-neon-green ring-neon-green/20',
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </motion.div>

      <motion.div
        layout
        className={cn(
          'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'rounded-tr-md bg-neon-blue/12 text-text-primary ring-1 ring-neon-blue/15'
            : 'rounded-tl-md border border-border/80 bg-surface-elevated/90 text-text-secondary',
        )}
      >
        {!isUser && message.capability && message.capability !== 'chat' ? (
          <Badge variant="primary" className="mb-2 text-[10px]">
            {AI_CAPABILITY_LABELS[message.capability]}
          </Badge>
        ) : null}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <time className="mt-2 block text-[10px] text-text-muted">
          {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
      </motion.div>
    </motion.div>
  )
}
