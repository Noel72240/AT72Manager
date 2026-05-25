import { create } from 'zustand'
import type { AiCapability, AiChatMessage, AiConversation, SavAiContext } from '@/services/ai/types'
import { aiService } from '@/services/ai/ai.service'
import { enrichContextWithActiveIntervention } from '@/services/ai/heuristics/sav-heuristic.engine'
import { aiConversationsRepository } from '@/services/database/repositories/ai-conversations.repository'
import {
  AI_CAPABILITY_LABELS,
  AI_CAPABILITY_USER_PROMPTS,
} from '@/modules/ai/constants/ai-capabilities'

export type AiContextBinding = {
  label: string
  context: SavAiContext
}

type AiStore = {
  panelOpen: boolean
  loading: boolean
  sending: boolean
  activeCapability: AiCapability | null
  messages: AiChatMessage[]
  conversationId: string | null
  conversationTitle: string
  conversationCreatedAt: string | null
  contextBinding: AiContextBinding | null
  interventionPool: Array<{
    id: string
    reportedIssue: string
    status: string
    brand?: string
    model?: string
    deviceLabel?: string
    diagnostic?: string
    technicianNotes?: string
    scheduledAt?: string
    priority?: string
    updatedAt: string
  }>
  providerLabel: string
  setPanelOpen: (open: boolean) => void
  togglePanel: () => void
  setContextBinding: (binding: AiContextBinding | null) => void
  setInterventionPool: (items: AiStore['interventionPool']) => void
  loadHistory: (userId: string) => Promise<void>
  sendMessage: (userId: string, text: string, capability?: AiCapability) => Promise<string | null>
  runQuickAction: (userId: string, capability: AiCapability, prompt?: string) => Promise<string | null>
  clearConversation: () => void
  newConversation: () => void
}

function createMessage(role: AiChatMessage['role'], content: string, capability?: AiCapability): AiChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    capability,
    createdAt: new Date().toISOString(),
  }
}

function resolveContext(get: () => AiStore): SavAiContext | undefined {
  const binding = get().contextBinding
  if (!binding) return undefined
  return enrichContextWithActiveIntervention(binding.context, get().interventionPool)
}

export const useAiStore = create<AiStore>((set, get) => ({
  panelOpen: false,
  loading: false,
  sending: false,
  activeCapability: null,
  messages: [],
  conversationId: null,
  conversationTitle: 'Nouvelle conversation',
  conversationCreatedAt: null,
  contextBinding: null,
  interventionPool: [],
  providerLabel: aiService.getProviderLabel(),

  setPanelOpen: (open) => set({ panelOpen: open }),
  togglePanel: () => set({ panelOpen: !get().panelOpen }),

  setContextBinding: (binding) => set({ contextBinding: binding }),

  setInterventionPool: (items) => set({ interventionPool: items }),

  loadHistory: async (userId) => {
    set({ loading: true })
    try {
      const list = await aiConversationsRepository.list()
      const latest = list.find((c) => c.userId === userId)
      if (latest) {
        set({
          conversationId: latest.id,
          conversationTitle: latest.title,
          conversationCreatedAt: latest.createdAt,
          messages: latest.messages,
          contextBinding: latest.contextSnapshot
            ? { label: 'Contexte sauvegardé', context: latest.contextSnapshot }
            : get().contextBinding,
        })
      }
    } finally {
      set({ loading: false, providerLabel: aiService.getProviderLabel() })
    }
  },

  sendMessage: async (userId, text, capability = 'chat') => {
    const trimmed = text.trim()
    if (!trimmed) return null

    const userMsg = createMessage('user', trimmed, capability)
    const nextMessages = [...get().messages, userMsg]
    set({ messages: nextMessages, sending: true, activeCapability: capability })

    try {
      const context = resolveContext(get)
      const engineMessage =
        capability === 'chat' ? trimmed : (AI_CAPABILITY_USER_PROMPTS[capability] ?? trimmed)

      const response = await aiService.complete({
        capability,
        userMessage: engineMessage,
        context,
        history: nextMessages,
      })

      const assistantMsg = createMessage('assistant', response.content, capability)
      const finalMessages = [...nextMessages, assistantMsg]
      set({ messages: finalMessages })

      const title =
        get().conversationTitle === 'Nouvelle conversation'
          ? (capability === 'chat' ? trimmed : AI_CAPABILITY_LABELS[capability]).slice(0, 48)
          : get().conversationTitle

      const now = new Date().toISOString()
      const createdAt = get().conversationCreatedAt ?? now

      const conversation: AiConversation = {
        id: get().conversationId ?? crypto.randomUUID(),
        title,
        messages: finalMessages,
        contextSnapshot: context,
        userId,
        createdAt,
        updatedAt: now,
      }

      const isUpdate = Boolean(get().conversationId)
      const saved = await aiConversationsRepository.save(conversation, isUpdate)
      set({
        conversationId: saved.id,
        conversationTitle: saved.title,
        conversationCreatedAt: saved.createdAt,
      })

      return response.content
    } catch (error) {
      const errMsg = createMessage(
        'assistant',
        error instanceof Error ? error.message : 'Erreur assistant IA',
        capability,
      )
      set({ messages: [...nextMessages, errMsg] })
      return null
    } finally {
      set({ sending: false, activeCapability: null })
    }
  },

  runQuickAction: async (userId, capability, prompt) => {
    const label = prompt?.trim() || `▶ ${AI_CAPABILITY_LABELS[capability]}`
    return get().sendMessage(userId, label, capability)
  },

  clearConversation: () =>
    set({
      messages: [],
      conversationId: null,
      conversationTitle: 'Nouvelle conversation',
      conversationCreatedAt: null,
      activeCapability: null,
    }),

  newConversation: () => get().clearConversation(),
}))
