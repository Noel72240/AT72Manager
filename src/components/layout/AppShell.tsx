import type { ReactNode } from 'react'
import { SessionRecoveryBridge } from '@/components/session/SessionRecoveryBridge'
import { MainContent } from '@/components/layout/MainContent'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { NotificationCenter } from '@/features/notifications/components/NotificationCenter'
import { AiChatPanel } from '@/modules/ai/components/AiChatPanel'

type AppShellProps = {
  children: ReactNode
  pageTitle?: string
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <SessionRecoveryBridge />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 size-[420px] rounded-full bg-neon-blue/6 blur-[100px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 size-[360px] rounded-full bg-neon-green/5 blur-[90px]"
      />

      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar title={pageTitle} />
        <MainContent>{children}</MainContent>
      </div>
      <NotificationCenter />
      <AiChatPanel />
    </div>
  )
}
