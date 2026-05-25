import type { AiChatMessage, AiConversation, SavAiContext } from '@/services/ai/types'
import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import { databaseService } from '@/services/database/database.service'
import { syncService } from '@/services/sync/sync.service'

const MAX_CONVERSATIONS = 50

function mapRow(row: Record<string, unknown>): AiConversation {
  return {
    id: row.id as string,
    title: (row.title as string) ?? 'Conversation',
    messages: (row.messages as AiChatMessage[]) ?? [],
    contextSnapshot: (row.context_snapshot as SavAiContext | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userId: row.user_id as string,
  }
}

function sortByUpdated(items: AiConversation[]): AiConversation[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

async function trimLocal(items: AiConversation[]): Promise<void> {
  const db = await getDb()
  const sorted = sortByUpdated(items).slice(0, MAX_CONVERSATIONS)
  const tx = db.transaction(STORES.aiConversations, 'readwrite')
  await tx.store.clear()
  for (const item of sorted) {
    await tx.store.put(item)
  }
  await tx.done
}

export const aiConversationsRepository = {
  async listLocal(): Promise<AiConversation[]> {
    const db = await getDb()
    return sortByUpdated(await db.getAll(STORES.aiConversations))
  },

  async list(): Promise<AiConversation[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocal()
    }
    try {
      const rows = await databaseService.list('ai_conversations')
      const items = rows.map((row) => mapRow(row as Record<string, unknown>))
      await trimLocal(items)
      return sortByUpdated(items)
    } catch {
      return this.listLocal()
    }
  },

  async save(conversation: AiConversation, isUpdate: boolean): Promise<AiConversation> {
    const now = new Date().toISOString()
    const item: AiConversation = {
      ...conversation,
      updatedAt: now,
      createdAt: conversation.createdAt || now,
    }

    const all = await this.listLocal()
    await trimLocal([item, ...all.filter((c) => c.id !== item.id)])

    const row = {
      id: item.id,
      title: item.title,
      messages: item.messages,
      context_snapshot: item.contextSnapshot ?? null,
      user_id: item.userId,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }

    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'ai_conversations',
        action: isUpdate ? 'update' : 'create',
        entityId: item.id,
        payload: row,
      })
      return item
    }

    try {
      if (isUpdate) {
        await databaseService.update('ai_conversations', item.id, {
          title: item.title,
          messages: item.messages,
          context_snapshot: item.contextSnapshot ?? null,
          updated_at: item.updatedAt,
        })
      } else {
        await databaseService.insert('ai_conversations', row)
      }
    } catch {
      await syncService.enqueue({
        entity: 'ai_conversations',
        action: isUpdate ? 'update' : 'create',
        entityId: item.id,
        payload: row,
      })
    }

    return item
  },

  async remove(id: string): Promise<void> {
    const db = await getDb()
    await db.delete(STORES.aiConversations, id)
    if (!databaseService.isAvailable()) {
      await syncService.enqueue({
        entity: 'ai_conversations',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
      return
    }
    try {
      await databaseService.remove('ai_conversations', id)
    } catch {
      await syncService.enqueue({
        entity: 'ai_conversations',
        action: 'delete',
        entityId: id,
        payload: { id },
      })
    }
  },
}
