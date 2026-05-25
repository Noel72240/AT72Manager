import { useSessionRecovery } from '@/hooks/useSessionRecovery'

/** Doit être monté sous React Router. */
export function SessionRecoveryBridge() {
  useSessionRecovery()
  return null
}
