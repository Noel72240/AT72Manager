import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'
import { env } from '@/config/env'
import { StartupSplash } from '@/components/startup/StartupSplash'
import { useStartup } from '@/hooks/useStartup'
import { useBackgroundSyncEngine } from '@/hooks/useBackgroundSyncEngine'

type StartupGateProps = {
  children: ReactNode
}

const FORCE_HIDE_MS = env.isProduction ? 6_000 : 8_000

export function StartupGate({ children }: StartupGateProps) {
  const { isVisible, progress, phaseLabel, subLabel, version, status } = useStartup()
  const [forceHide, setForceHide] = useState(false)
  const startupDone = status === 'done' || forceHide

  useBackgroundSyncEngine(startupDone)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      console.warn('[startup] force hide overlay — accès application')
      setForceHide(true)
    }, FORCE_HIDE_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const showOverlay = isVisible && !forceHide

  return (
    <>
      {/* App toujours rendue — évite l'écran noir si le splash ne s'affiche pas */}
      <div className="min-h-screen bg-background">{children}</div>

      <AnimatePresence>
        {showOverlay ? (
          <StartupSplash
            progress={progress}
            phaseLabel={phaseLabel}
            subLabel={subLabel}
            status={status}
            version={version}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}
