import { getMeta, setMeta } from '@/services/indexeddb/db'

type DocumentKind = 'quote' | 'invoice'

const PREFIX: Record<DocumentKind, string> = {
  quote: 'DEV',
  invoice: 'FAC',
}

function metaKey(kind: DocumentKind, year: number): string {
  return `doc_seq_${kind}_${year}`
}

/** Numérotation séquentielle locale (offline-first) : DEV-2026-0001 */
export async function allocateDocumentNumber(kind: DocumentKind): Promise<string> {
  const year = new Date().getFullYear()
  const key = metaKey(kind, year)
  const current = (await getMeta<number>(key)) ?? 0
  const next = current + 1
  await setMeta(key, next)
  const prefix = PREFIX[kind]
  return `${prefix}-${year}-${String(next).padStart(4, '0')}`
}
