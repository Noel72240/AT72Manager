import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@tauri-apps/api/core'
import { env } from '@/config/env'
import { productionLogger } from '@/services/desktop/production-logger.service'

export type CrashPayload = {
  type: string
  message: string
  stack?: string
  componentStack?: string
  url?: string
  userAgent?: string
  appVersion: string
  environment: string
  timestamp: string
  extra?: Record<string, unknown>
}

let handlersInstalled = false

export async function persistCrashReport(payload: CrashPayload): Promise<string | null> {
  productionLogger.error(`crash:${payload.type}`, payload.message)

  if (!isTauri()) {
    try {
      localStorage.setItem('at72:last-crash', JSON.stringify(payload))
    } catch {
      /* quota */
    }
    return null
  }

  try {
    return await invoke<string>('write_crash_report', {
      payload: JSON.stringify(payload, null, 2),
    })
  } catch (error) {
    productionLogger.error('crash report write failed', String(error))
    return null
  }
}

function basePayload(type: string, message: string, stack?: string): CrashPayload {
  return {
    type,
    message,
    stack,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    appVersion: env.appVersion,
    environment: env.appEnvironment,
    timestamp: new Date().toISOString(),
  }
}

export function installCrashHandlers(): void {
  if (handlersInstalled || typeof window === 'undefined') return
  handlersInstalled = true

  window.addEventListener('error', (event) => {
    void persistCrashReport(
      basePayload(
        'window_error',
        event.message || 'Erreur JavaScript',
        event.error?.stack,
      ),
    )
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const message =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Promise rejetée'
    const stack = reason instanceof Error ? reason.stack : undefined
    void persistCrashReport(basePayload('unhandled_rejection', message, stack))
  })
}

export async function reportReactError(error: Error, componentStack?: string): Promise<void> {
  await persistCrashReport({
    ...basePayload('react_error_boundary', error.message, error.stack),
    componentStack,
  })
}
