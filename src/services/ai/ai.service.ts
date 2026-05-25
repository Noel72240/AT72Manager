import { env } from '@/config/env'
import { completeWithMock } from '@/services/ai/providers/mock.provider'
import { completeWithOpenAI } from '@/services/ai/providers/openai.provider'
import type { AiCompletionRequest, AiCompletionResponse } from '@/services/ai/types'

export const aiService = {
  isConfigured(): boolean {
    return env.isAiEnabled
  },

  usesCloud(): boolean {
    return env.isOpenAiConfigured
  },

  getProviderLabel(): string {
    if (env.isOpenAiConfigured) return `OpenAI · ${env.openAiModel}`
    return 'Moteur SAV expert · v3 local'
  },

  async complete(request: AiCompletionRequest): Promise<AiCompletionResponse> {
    if (!env.isAiEnabled) {
      throw new Error('Assistant IA désactivé. Activez VITE_AI_ENABLED=true dans .env')
    }

    if (env.isOpenAiConfigured && navigator.onLine) {
      try {
        return await completeWithOpenAI(request)
      } catch (error) {
        console.warn('[ai] OpenAI failed, fallback mock:', error)
        const mock = await completeWithMock(request)
        return {
          ...mock,
          content: `${mock.content}\n\n---\n_OpenAI indisponible — réponse locale de secours._`,
        }
      }
    }

    return completeWithMock(request)
  },
}
