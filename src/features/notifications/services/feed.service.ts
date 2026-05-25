import type { ActivityFeedItemInsert, FeedItemKind } from '@/types/entities'
import { activityFeedRepository } from '@/services/database/repositories/activity-feed.repository'
import { useFeedStore } from '@/store/feed.store'
import { DEFAULT_FEED_SEVERITY } from '@/features/notifications/utils/feed-labels'
import { toast, type ToastVariant } from '@/store/toast.store'

export type EmitFeedOptions = {
  /** Afficher aussi un toast éphémère */
  toast?: boolean
  toastVariant?: ToastVariant
  /** Ne pas recréer si dedupeKey existe déjà */
  dedupe?: boolean
}

export type EmitFeedInput = Omit<ActivityFeedItemInsert, 'severity' | 'userId'> & {
  kind: FeedItemKind
  severity?: ActivityFeedItemInsert['severity']
}

export async function emitFeedItem(
  userId: string,
  input: EmitFeedInput,
  options: EmitFeedOptions = {},
): Promise<void> {
  const severity = input.severity ?? DEFAULT_FEED_SEVERITY[input.kind]

  if (options.dedupe !== false && input.dedupeKey) {
    const existing = await activityFeedRepository.findByDedupeKey(input.dedupeKey, userId)
    if (existing) {
      if (!existing.read) return
      await activityFeedRepository.update(existing.id, { read: false })
      useFeedStore.getState().upsertItem({ ...existing, read: false })
      return
    }
  }

  const created = await activityFeedRepository.create({
    ...input,
    severity,
    userId,
  })

  useFeedStore.getState().upsertItem(created)

  if (options.toast) {
    const variant = options.toastVariant ?? (severity === 'danger' ? 'error' : severity === 'warning' ? 'warning' : severity === 'success' ? 'success' : 'info')
    toast[variant](input.title, input.message)
  }
}
