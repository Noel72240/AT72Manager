const DEVICE_FP_KEY = 'at72-device-fingerprint'

export function getDeviceLabel(): string {
  const ua = navigator.userAgent
  if (ua.includes('Windows')) return 'PC Windows'
  if (ua.includes('Mac')) return 'Mac'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Desktop'
}

export function getDeviceFingerprint(): string {
  try {
    const stored = localStorage.getItem(DEVICE_FP_KEY)
    if (stored) return stored
  } catch {
    /* ignore */
  }

  const parts = [
    navigator.platform,
    navigator.language,
    String(screen.width),
    String(screen.height),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ]
  const raw = parts.join('|')
  let hash = 0
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  const fp = `fp-${Math.abs(hash).toString(36)}`

  try {
    localStorage.setItem(DEVICE_FP_KEY, fp)
  } catch {
    /* ignore */
  }

  return fp
}

export function getSessionMetaKey(userId: string): string {
  return `active_session_${userId}`
}
