import { SYNC_ENGINE_CONFIG } from '@/services/sync/sync-engine.config'

export function computeRetryBackoffMs(retryCount: number): number {
  const exp = SYNC_ENGINE_CONFIG.baseBackoffMs * 2 ** Math.max(0, retryCount - 1)
  return Math.min(exp, SYNC_ENGINE_CONFIG.maxBackoffMs)
}

export function computeNextRetryAt(retryCount: number): string {
  return new Date(Date.now() + computeRetryBackoffMs(retryCount)).toISOString()
}

export function isRetryDue(nextRetryAt?: string): boolean {
  if (!nextRetryAt) return true
  return Date.now() >= new Date(nextRetryAt).getTime()
}

export function hasExceededMaxRetries(retryCount: number): boolean {
  return retryCount >= SYNC_ENGINE_CONFIG.maxRetries
}
