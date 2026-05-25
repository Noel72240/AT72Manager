import { usePortalAuthInit } from '@/modules/portal/hooks/usePortalAuthInit'

/** Initialise l'auth portail sur toutes les routes /portal/* (login, register inclus). */
export function PortalAuthBridge() {
  usePortalAuthInit()
  return null
}
