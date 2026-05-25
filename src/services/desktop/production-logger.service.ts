import { invoke } from '@tauri-apps/api/core'
import { isTauri } from '@tauri-apps/api/core'
import { env } from '@/config/env'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const MAX_BUFFER = 200
const buffer: { at: string; level: LogLevel; message: string; detail?: string }[] = []

function push(level: LogLevel, message: string, detail?: string) {
  const entry = { at: new Date().toISOString(), level, message, detail }
  buffer.push(entry)
  if (buffer.length > MAX_BUFFER) buffer.shift()

  const line = detail ? `${message} | ${detail}` : message
  if (env.isDev) {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
    fn(`[AT72:${level}]`, line)
    return
  }

  if (isTauri()) {
    void invoke('write_native_log', { level, message: line }).catch(() => {
      /* fichier indisponible — ignore */
    })
  }
}

export const productionLogger = {
  debug: (message: string, detail?: string) => {
    if (env.isDev) push('debug', message, detail)
  },
  info: (message: string, detail?: string) => push('info', message, detail),
  warn: (message: string, detail?: string) => push('warn', message, detail),
  error: (message: string, detail?: string) => push('error', message, detail),
  getRecentEntries: () => [...buffer],
}
