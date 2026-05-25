import { env } from '@/config/env'
import { portalPaths } from '@/config/portal-paths'

/** URL publique du portail (ex. https://portal.allotech72.fr). */
export function getPortalPublicOrigin(): string {
  const configured = env.portalPublicUrl?.trim().replace(/\/+$/, '')
  if (configured) return configured

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'https://portal.allotech72.fr'
}

export function getPortalRegisterUrl(): string {
  return `${getPortalPublicOrigin()}${portalPaths.register()}`
}

export function getPortalLoginUrl(): string {
  return `${getPortalPublicOrigin()}${portalPaths.login()}`
}
