import type { AiCompletionRequest, AiCompletionResponse } from '@/services/ai/types'
import { buildLocalSavResponse } from '@/services/ai/heuristics/sav-heuristic.engine'

const MIN_DELAY_MS = 650
const MAX_DELAY_MS = 1100

function simulateProcessingDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function completeWithMock(request: AiCompletionRequest): Promise<AiCompletionResponse> {
  await simulateProcessingDelay()
  const content = buildLocalSavResponse(request)
  return {
    content,
    provider: 'local',
    model: 'at72-sav-expert-v3',
  }
}
