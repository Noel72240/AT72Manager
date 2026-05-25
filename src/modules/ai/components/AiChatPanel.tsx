import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AiContextBanner } from '@/modules/ai/components/AiContextBanner'
import { AiMessageBubble } from '@/modules/ai/components/AiMessageBubble'
import { AiChatComposer } from '@/modules/ai/components/AiChatComposer'
import { AiQuickActions } from '@/modules/ai/components/AiQuickActions'
import { AiThinkingIndicator } from '@/modules/ai/components/AiThinkingIndicator'
import { useAiAssistant } from '@/modules/ai/hooks/useAiAssistant'
import { useAiStore } from '@/store/ai.store'
import type { AiCapability } from '@/services/ai/types'
import { cn } from '@/utils/cn'

export function AiChatPanel() {
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { userId, isAiEnabled } = useAiAssistant()

  const panelOpen = useAiStore((state) => state.panelOpen)
  const setPanelOpen = useAiStore((state) => state.setPanelOpen)
  const messages = useAiStore((state) => state.messages)
  const sending = useAiStore((state) => state.sending)
  const activeCapability = useAiStore((state) => state.activeCapability)
  const loading = useAiStore((state) => state.loading)
  const providerLabel = useAiStore((state) => state.providerLabel)
  const sendMessage = useAiStore((state) => state.sendMessage)
  const runQuickAction = useAiStore((state) => state.runQuickAction)
  const newConversation = useAiStore((state) => state.newConversation)

  useEffect(() => {
    setPanelOpen(false)
  }, [location.pathname, setPanelOpen])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  if (!panelOpen) return null

  async function handleSend(text: string) {
    if (!userId) return
    await sendMessage(userId, text, 'chat')
  }

  async function handleQuickAction(capability: AiCapability) {
    if (!userId) return
    await runQuickAction(userId, capability)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer l'assistant IA"
        className="fixed inset-y-0 right-0 left-0 z-40 bg-background/60 backdrop-blur-sm lg:left-[260px]"
        onClick={() => setPanelOpen(false)}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Assistant IA SAV"
        initial={{ x: '100%', opacity: 0.9 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col',
          'border-l border-border bg-surface-elevated shadow-card glass-elevated',
        )}
      >
        <header className="relative overflow-hidden border-b border-border px-5 py-4">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-neon-blue/15 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-6 left-8 size-24 rounded-full bg-neon-green/10 blur-xl"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 8, -8, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  <Bot className="size-5 text-neon-blue" />
                </motion.div>
                <h2 className="text-lg font-semibold text-text-primary">Assistant SAV IA</h2>
                <Badge variant="primary">Premium</Badge>
              </div>
              <p className="mt-1 text-xs text-text-muted">{providerLabel}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Nouvelle conversation"
                onClick={() => newConversation()}
              >
                <Plus className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" aria-label="Fermer" onClick={() => setPanelOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <AiContextBanner />

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-text-muted">
              <Loader2 className="size-6 animate-spin text-neon-blue" />
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-neon-blue/20 bg-neon-blue/5 px-4 py-4 text-center">
                <Sparkles className="mx-auto size-8 text-neon-blue" />
                <p className="mt-2 text-sm font-medium text-text-primary">
                  Diagnostic & automatisation métier
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Contexte client, appareil et intervention injectés automatiquement.
                </p>
              </div>
              <AiQuickActions
                disabled={!isAiEnabled || !userId || sending}
                activeCapability={activeCapability}
                onAction={handleQuickAction}
                compact
              />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <AiMessageBubble key={message.id} message={message} />
              ))}
              {sending ? <AiThinkingIndicator capability={activeCapability} /> : null}
            </div>
          )}
        </div>

        {messages.length > 0 ? (
          <div className="border-t border-border/60 px-4 py-2">
            <AiQuickActions
              disabled={!isAiEnabled || sending || !userId}
              activeCapability={activeCapability}
              onAction={handleQuickAction}
              compact
            />
          </div>
        ) : null}

        <AiChatComposer
          disabled={!isAiEnabled || !userId}
          sending={sending}
          onSend={handleSend}
        />

        <footer className="border-t border-border px-4 py-2 text-center">
          <Link
            to={ROUTES.ASSISTANT}
            onClick={() => setPanelOpen(false)}
            className="text-[11px] text-neon-blue hover:underline"
          >
            Ouvrir l&apos;espace assistant complet →
          </Link>
        </footer>
      </motion.aside>
    </>
  )
}
