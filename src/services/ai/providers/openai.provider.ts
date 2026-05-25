import { env } from '@/config/env'
import { buildMessagesForCapability, formatContextForPrompt } from '@/services/ai/prompts/sav-prompts'
import type { AiCompletionRequest, AiCompletionResponse } from '@/services/ai/types'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export async function completeWithOpenAI(request: AiCompletionRequest): Promise<AiCompletionResponse> {
  const apiKey = env.openAiApiKey
  if (!apiKey) {
    throw new Error('Clé OpenAI non configurée')
  }

  const contextBlock = formatContextForPrompt(request.context)
  const history = (request.history ?? [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const messages = buildMessagesForCapability(
    request.capability,
    request.userMessage,
    contextBlock,
    history,
  ) as ChatMessage[]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openAiModel,
      messages,
      temperature: request.capability === 'diagnose' ? 0.35 : 0.55,
      max_tokens: 1200,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OpenAI (${response.status}): ${body.slice(0, 200)}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Réponse OpenAI vide')

  return { content, provider: 'openai', model: env.openAiModel }
}
