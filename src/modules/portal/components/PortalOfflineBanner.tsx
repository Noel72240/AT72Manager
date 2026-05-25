import { WifiOff } from 'lucide-react'
import { usePortalDataStore } from '@/store/portal-data.store'

export function PortalOfflineBanner() {
  const offline = usePortalDataStore((s) => s.offline)
  const fromCache = usePortalDataStore((s) => s.fromCache)
  if (!offline && !fromCache) return null

  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning">
      <WifiOff className="size-3.5 shrink-0" />
      {fromCache
        ? 'Mode hors ligne — données affichées depuis le cache local.'
        : 'Connexion perdue — certaines actions sont limitées.'}
    </div>
  )
}
