import { useAuthStore } from '@/store/auth.store'

/** workshop_id de l'utilisateur connecté (atelier actif) */
export function getWorkshopIdForDatabase(): string | undefined {
  return useAuthStore.getState().user?.workshopId
}

export function withWorkshopId(row: Record<string, unknown>): Record<string, unknown> {
  const workshopId = getWorkshopIdForDatabase()
  if (workshopId && row.workshop_id == null) {
    return { ...row, workshop_id: workshopId }
  }
  return row
}
