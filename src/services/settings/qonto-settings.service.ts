import { env } from '@/config/env'
import { getMeta, setMeta } from '@/services/indexeddb/db'

const QONTO_APP_URL_KEY = 'qonto_app_url'

export async function getQontoAppUrl(): Promise<string> {
  const custom = await getMeta<string>(QONTO_APP_URL_KEY)
  if (custom?.trim()) return custom.trim()
  return env.qontoAppUrl
}

export async function saveQontoAppUrl(url: string): Promise<void> {
  await setMeta(QONTO_APP_URL_KEY, url.trim())
}

export function buildQontoOpenUrl(baseUrl: string, externalRef?: string, documentUrl?: string): string {
  if (documentUrl?.trim()) return documentUrl.trim()
  const base = baseUrl.replace(/\/$/, '')
  if (externalRef?.trim()) {
    return `${base}/search?q=${encodeURIComponent(externalRef.trim())}`
  }
  return base
}
