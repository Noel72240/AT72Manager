export type StartupPhaseId = 'system' | 'services' | 'sync' | 'ai' | 'ready'

export type StartupPhase = {
  id: StartupPhaseId
  label: string
  /** Poids pour la barre de progression (0–100 cumulé) */
  weight: number
}

export const STARTUP_PHASES: StartupPhase[] = [
  { id: 'system', label: 'Initialisation système', weight: 22 },
  { id: 'services', label: 'Chargement services', weight: 24 },
  { id: 'sync', label: 'Synchronisation atelier', weight: 26 },
  { id: 'ai', label: 'Chargement IA heuristique', weight: 18 },
  { id: 'ready', label: 'Préparation interface', weight: 10 },
]

/** Durée minimale splash (premium, pas trop long) */
export const STARTUP_MIN_DURATION_MS = 2400

/** Durée transition sortie vers l'app */
export const STARTUP_EXIT_DURATION_MS = 650

/** Préparation extensions futures */
export type StartupFutureFlags = {
  soundEnabled: boolean
  videoIntroEnabled: boolean
  checkUpdatesOnBoot: boolean
  showCloudSyncStatus: boolean
}

export const DEFAULT_STARTUP_FUTURE: StartupFutureFlags = {
  soundEnabled: false,
  videoIntroEnabled: false,
  checkUpdatesOnBoot: false,
  showCloudSyncStatus: false,
}
