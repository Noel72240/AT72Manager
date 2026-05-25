import type { ReactNode } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { ToastContainer } from '@/components/ui/Toast'
import { ensureSupabaseClient } from '@/services/supabase/client'

type PortalProvidersProps = {
  children: ReactNode
}

function PortalBootstrap({ children }: PortalProvidersProps) {
  void ensureSupabaseClient()
  return <>{children}</>
}

export function PortalProviders({ children }: PortalProvidersProps) {
  return (
    <LazyMotion features={domAnimation}>
      <PortalBootstrap>
        {children}
        <ToastContainer />
      </PortalBootstrap>
    </LazyMotion>
  )
}
