import { getMeta, setMeta } from '@/services/indexeddb/db'

export type UiSessionSnapshot = {
  lastRoute?: string
  sidebarCollapsed?: boolean
  lastSearchQuery?: string
  updatedAt: string
}

const META_UI_SESSION = 'ui_session_snapshot'

export const sessionRecoveryService = {
  async load(): Promise<UiSessionSnapshot | null> {
    return (await getMeta<UiSessionSnapshot>(META_UI_SESSION)) ?? null
  },

  async save(partial: Omit<UiSessionSnapshot, 'updatedAt'>): Promise<void> {
    const existing = (await this.load()) ?? { updatedAt: new Date().toISOString() }
    await setMeta(META_UI_SESSION, {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    })
  },

  async clear(): Promise<void> {
    await setMeta(META_UI_SESSION, null)
  },
}
