import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Loader2, SendHorizonal } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

type AiChatComposerProps = {
  disabled?: boolean
  sending?: boolean
  onSend: (text: string) => void
  placeholder?: string
}

export function AiChatComposer({
  disabled,
  sending,
  onSend,
  placeholder = 'Posez votre question SAV…',
}: AiChatComposerProps) {
  const [text, setText] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || disabled || sending) return
    onSend(trimmed)
    setText('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-surface-elevated/80 p-4 backdrop-blur-sm"
    >
      <motion.div
        layout
        className={cn(
          'flex items-end gap-2 rounded-xl border border-border-subtle bg-background/60 p-2',
          'focus-within:border-neon-blue/30 focus-within:ring-1 focus-within:text-neon-blue/20',
        )}
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={2}
          disabled={disabled || sending}
          placeholder={placeholder}
          className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted disabled:opacity-60"
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleSubmit(event)
            }
          }}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!text.trim() || disabled || sending}
          className="shrink-0 gap-1.5"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <SendHorizonal className="size-4" />
          )}
          Envoyer
        </Button>
      </motion.div>
      <p className="mt-2 text-[10px] text-text-muted">
        Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
      </p>
    </form>
  )
}
