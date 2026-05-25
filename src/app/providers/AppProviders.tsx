import type { ReactNode } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ToastContainer } from '@/components/ui/Toast'
import { useAuthInit } from '@/hooks/useAuthInit'
import { useSyncInit } from '@/hooks/useSyncInit'
import { useNotificationEngine } from '@/features/notifications/hooks/useNotificationEngine'
import { useAutoBackupEngine } from '@/modules/settings/hooks/useAutoBackupEngine'
import { useGoogleCalendarSyncEngine } from '@/hooks/useGoogleCalendarSyncEngine'
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat'
import { useLocalDbInit } from '@/hooks/useLocalDbInit'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
type AppProvidersProps = {
  children: ReactNode
}

function AppBootstrap({ children }: AppProvidersProps) {
  useLocalDbInit()
  useAuthInit()
  useSyncInit()
  useKeyboardShortcuts()
  useNotificationEngine()
  useAutoBackupEngine()
  useSessionHeartbeat()
  useGoogleCalendarSyncEngine()
  return <>{children}</>
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <LazyMotion features={domAnimation}>
      <AppBootstrap>
        {children}
        <ToastContainer />
      </AppBootstrap>
    </LazyMotion>
  )
}
