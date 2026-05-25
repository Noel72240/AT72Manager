import { env } from '@/config/env'
import { getMeta, setMeta } from '@/services/indexeddb/db'

const META_MAX_SIZE_MB = 'document_max_size_mb'

const DEFAULT_MAX_MB = 15
const DEFAULT_SIGNED_URL_TTL_SEC = 3600

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number]

export const documentSettingsService = {
  async getMaxSizeBytes(): Promise<number> {
    const envMb = Number(import.meta.env.VITE_MAX_DOCUMENT_SIZE_MB)
    const envDefault = Number.isFinite(envMb) && envMb > 0 ? envMb : DEFAULT_MAX_MB
    try {
      const stored = await getMeta<number>(META_MAX_SIZE_MB)
      const mb = stored && stored > 0 ? stored : envDefault
      return mb * 1024 * 1024
    } catch {
      return envDefault * 1024 * 1024
    }
  },

  async setMaxSizeMb(mb: number): Promise<void> {
    await setMeta(META_MAX_SIZE_MB, mb)
  },

  getSignedUrlTtlSeconds(): number {
    const fromEnv = Number(import.meta.env.VITE_DOCUMENT_SIGNED_URL_TTL_SEC)
    return Number.isFinite(fromEnv) && fromEnv > 60 ? fromEnv : DEFAULT_SIGNED_URL_TTL_SEC
  },

  isAllowedMime(mime: string): mime is AllowedDocumentMime {
    return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime)
  },

  isPdfOnlyMode(): boolean {
    return (import.meta.env.VITE_DOCUMENTS_PDF_ONLY ?? 'false') === 'true'
  },

  getAllowedMimeTypes(): string[] {
    if (this.isPdfOnlyMode()) return ['application/pdf']
    return [...ALLOWED_DOCUMENT_MIME_TYPES]
  },

  formatMaxSizeLabel(): string {
  const mb = Number(import.meta.env.VITE_MAX_DOCUMENT_SIZE_MB) || DEFAULT_MAX_MB
    return `${mb} Mo`
  },

  appName: env.appName,
}
