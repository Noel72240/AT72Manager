export type BackupLogLevel = 'info' | 'warn' | 'error' | 'success'

export type BackupLogEntry = {
  at: string
  level: BackupLogLevel
  code: string
  message: string
  detail?: string
}

const MAX_LOG_ENTRIES = 200

export function createBackupLogger(onEntry?: (entry: BackupLogEntry) => void) {
  const entries: BackupLogEntry[] = []

  function push(level: BackupLogLevel, code: string, message: string, detail?: string) {
    const entry: BackupLogEntry = {
      at: new Date().toISOString(),
      level,
      code,
      message,
      detail,
    }
    entries.push(entry)
    if (entries.length > MAX_LOG_ENTRIES) entries.shift()
    const prefix = `[backup:${code}]`
    if (level === 'error') console.error(prefix, message, detail ?? '')
    else if (level === 'warn') console.warn(prefix, message, detail ?? '')
    else console.info(prefix, message, detail ?? '')
    onEntry?.(entry)
  }

  return {
    entries,
    info: (code: string, message: string, detail?: string) => push('info', code, message, detail),
    warn: (code: string, message: string, detail?: string) => push('warn', code, message, detail),
    error: (code: string, message: string, detail?: string) => push('error', code, message, detail),
    success: (code: string, message: string, detail?: string) => push('success', code, message, detail),
  }
}

export type BackupLogger = ReturnType<typeof createBackupLogger>
