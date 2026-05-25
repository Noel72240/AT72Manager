import { isTauri } from '@tauri-apps/api/core'

export type NativeNotificationPayload = {
  title: string
  body: string
}

export const nativeNotificationsService = {
  async isAvailable(): Promise<boolean> {
    return isTauri()
  },

  async notify(payload: NativeNotificationPayload): Promise<void> {
    if (!isTauri()) return

    try {
      const { sendNotification, isPermissionGranted, requestPermission } = await import(
        '@tauri-apps/plugin-notification'
      )
      let granted = await isPermissionGranted()
      if (!granted) {
        const permission = await requestPermission()
        granted = permission === 'granted'
      }
      if (!granted) return

      sendNotification({ title: payload.title, body: payload.body })
    } catch (error) {
      console.warn('[native-notifications]', error)
    }
  },
}
