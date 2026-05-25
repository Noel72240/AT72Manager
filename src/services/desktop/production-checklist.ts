import { env } from '@/config/env'

export type ProductionCheck = {
  id: string
  label: string
  ok: boolean
  hint?: string
}

/** Vérifications affichables dans Paramètres avant déploiement multi-PC. */
export function getProductionReadinessChecks(): ProductionCheck[] {
  return [
    {
      id: 'env',
      label: 'Mode production',
      ok: env.isProduction,
      hint: 'Build avec npm run build:production',
    },
    {
      id: 'supabase',
      label: 'Supabase configuré',
      ok: env.isSupabaseConfigured && !env.supabaseConfigError,
      hint: 'VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY dans .env.production',
    },
    {
      id: 'google',
      label: 'Google Calendar (OAuth bureau)',
      ok: env.isGoogleCalendarConfigured,
      hint: 'Client OAuth type « Application de bureau » + VITE_GOOGLE_CLIENT_ID',
    },
    {
      id: 'offline',
      label: 'Mode hors-ligne (IndexedDB)',
      ok: true,
      hint: 'Données locales %AppData%\\com.at72manager.desktop',
    },
  ]
}
