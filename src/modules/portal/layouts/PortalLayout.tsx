import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PortalShell } from '@/modules/portal/layouts/PortalShell'
import { usePortalDataSync } from '@/modules/portal/hooks/usePortalDataSync'
import { PortalOfflineBanner } from '@/modules/portal/components/PortalOfflineBanner'
import { PortalLegalFooter } from '@/modules/portal/legal/components/PortalLegalFooter'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'

export function PortalLayout() {
  usePortalDataSync()

  usePortalPageMeta({
    title: 'Espace client',
    description: 'Suivi de vos réparations, devis, factures et messagerie atelier AlloTech72.',
    robots: 'noindex, nofollow',
  })

  return (
    <PortalShell>
      <PortalOfflineBanner />
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <div className="flex-1">
          <Outlet />
        </div>
        <PortalLegalFooter variant="compact" />
      </motion.div>
    </PortalShell>
  )
}
