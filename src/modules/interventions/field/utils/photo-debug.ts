/** Logs debug photos (actifs en développement uniquement) */
export const photoDebug = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.log('[AT72 Photos]', ...args)
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) console.warn('[AT72 Photos]', ...args)
  },
  error: (...args: unknown[]) => {
    console.error('[AT72 Photos]', ...args)
  },
}
