import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PortalShell } from '@/modules/portal/layouts/PortalShell'
import { usePortalDataSync } from '@/modules/portal/hooks/usePortalDataSync'
import { PortalOfflineBanner } from '@/modules/portal/components/PortalOfflineBanner'

export function PortalLayout() {
  usePortalDataSync()

  return (
    <PortalShell>
      <PortalOfflineBanner />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex-1 overflow-y-auto"
      >
        <Outlet />
      </motion.div>
    </PortalShell>
  )
}
