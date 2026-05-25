import { useEffect } from 'react'
import { env } from '@/config/env'
import { getPortalLoginUrl } from '@/config/portal-public-url'

/**
 * Redirige vers le portail web public quand l’app desktop pointe vers portal.allotech72.fr.
 */
export function PortalExternalRedirect() {
  useEffect(() => {
    const target = env.portalPublicUrl ? getPortalLoginUrl() : null
    if (target) {
      window.location.replace(target)
    }
  }, [])

  if (!env.portalPublicUrl) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
      <p className="text-sm text-text-secondary">
        Redirection vers le portail client…
        <br />
        <a href={getPortalLoginUrl()} className="mt-2 inline-block text-neon-blue underline">
          {getPortalLoginUrl()}
        </a>
      </p>
    </div>
  )
}
