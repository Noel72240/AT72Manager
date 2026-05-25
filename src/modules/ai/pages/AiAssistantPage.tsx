import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Bot, Cloud, Cpu, History, Shield, Sparkles, Zap } from 'lucide-react'
import { AiChatComposer } from '@/modules/ai/components/AiChatComposer'
import { AiMessageBubble } from '@/modules/ai/components/AiMessageBubble'
import { AiQuickActions } from '@/modules/ai/components/AiQuickActions'
import { AiThinkingIndicator } from '@/modules/ai/components/AiThinkingIndicator'
import { AiTrendsCard } from '@/modules/ai/components/AiTrendsCard'
import { AiContextBanner } from '@/modules/ai/components/AiContextBanner'
import { useAiAssistant } from '@/modules/ai/hooks/useAiAssistant'
import { useAiStore } from '@/store/ai.store'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type { AiCapability } from '@/services/ai/types'
import { staggerContainer, fadeInUp } from '@/utils/motion'
import { env } from '@/config/env'

export function AiAssistantPage() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { userId, trends, loadingData, isAiEnabled, usesCloud, providerLabel } = useAiAssistant()

  const messages = useAiStore((state) => state.messages)
  const sending = useAiStore((state) => state.sending)
  const activeCapability = useAiStore((state) => state.activeCapability)
  const sendMessage = useAiStore((state) => state.sendMessage)
  const runQuickAction = useAiStore((state) => state.runQuickAction)
  const newConversation = useAiStore((state) => state.newConversation)

  async function handleSend(text: string) {
    if (!userId) return
    await sendMessage(userId, text, 'chat')
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  async function handleQuickAction(capability: AiCapability) {
    if (!userId) return
    await runQuickAction(userId, capability)
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-7xl space-y-6 p-6"
    >
      <motion.header variants={fadeInUp} className="relative overflow-hidden rounded-2xl border border-border glass p-6">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-neon-blue/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="size-7 text-neon-blue" />
              <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
                Assistant IA SAV
              </h1>
              <Badge variant="primary">Premium</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-text-muted">
              Diagnostic intelligent, génération automatique de documents SAV et analyse des tendances
              atelier — contexte client, appareil et intervention injecté en temps réel.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="default">{providerLabel}</Badge>
              {usesCloud ? (
                <Badge variant="primary">
                  <Cloud className="mr-1 inline size-3" />
                  OpenAI
                </Badge>
              ) : (
                <Badge variant="default">
                  <Cpu className="mr-1 inline size-3" />
                  Mode local
                </Badge>
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => newConversation()}>
            Nouvelle conversation
          </Button>
        </div>
      </motion.header>

      <motion.div variants={fadeInUp} className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden p-0">
          <AiContextBanner />
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-dashed border-neon-blue/25 bg-neon-blue/5 px-6 py-10 text-center"
              >
                <Sparkles className="mx-auto size-10 text-neon-blue" />
                <p className="mt-3 text-sm font-medium text-text-primary">
                  Votre copilote SAV nouvelle génération
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs text-text-muted">
                  Utilisez les actions rapides ou posez une question. Configurez{' '}
                  <code className="rounded bg-surface-hover px-1">VITE_OPENAI_API_KEY</code> pour
                  activer l&apos;IA cloud.
                </p>
              </motion.div>
            ) : (
              <>
                {messages.map((message) => (
                  <AiMessageBubble key={message.id} message={message} />
                ))}
                {sending ? <AiThinkingIndicator capability={activeCapability} /> : null}
              </>
            )}
          </div>
          <div className="border-t border-border/60 p-4">
            <AiQuickActions
              disabled={!isAiEnabled || sending || !userId}
              activeCapability={activeCapability}
              onAction={handleQuickAction}
            />
          </div>
          <AiChatComposer disabled={!isAiEnabled || !userId} sending={sending} onSend={handleSend} />
        </Card>

        <aside className="space-y-4">
          <AiTrendsCard trends={trends} loading={loadingData} />

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-text-primary">Capacités</h3>
            <ul className="mt-3 space-y-2 text-xs text-text-muted">
              <li className="flex items-center gap-2">
                <Zap className="size-3.5 text-neon-green" />
                Diagnostic panne & composants suspects
              </li>
              <li className="flex items-center gap-2">
                <History className="size-3.5 text-neon-blue" />
                Historique conversations persistant
              </li>
              <li className="flex items-center gap-2">
                <Shield className="size-3.5 text-neon-green" />
                Fallback offline (heuristique locale)
              </li>
            </ul>
          </Card>

          <Card className="border-dashed p-5">
            <h3 className="text-sm font-semibold text-text-primary">Roadmap RAG</h3>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              Architecture prête pour documentation SAV, modèles locaux (Ollama) et enrichissement
              par base de connaissances atelier.
            </p>
            {!env.isOpenAiConfigured ? (
              <p className="mt-3 text-[11px] text-warning">
                IA cloud inactive — réponses heuristiques locales actives.
              </p>
            ) : null}
          </Card>
        </aside>
      </motion.div>
    </motion.div>
  )
}
