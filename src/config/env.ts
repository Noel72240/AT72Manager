import { validateSupabaseEnv, getSupabaseRefFromAnonKey, getSupabaseRefFromUrl, normalizeSupabaseUrl } from '@/config/supabase-env'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

const viteAppEnv = import.meta.env.VITE_APP_ENV ?? ''
export type AppEnvironment = 'development' | 'production'

/** Production Tauri build : mode production + pas de dev server. */
export const appEnvironment: AppEnvironment =
  viteAppEnv === 'production' || (!import.meta.env.DEV && viteAppEnv !== 'development')
    ? 'production'
    : 'development'

const supabaseUrl = rawSupabaseUrl ? normalizeSupabaseUrl(rawSupabaseUrl) : ''

export const env = {
  appName: 'AT72Manager',
  appVersion: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
  appEnvironment,
  isDev: import.meta.env.DEV,
  isProduction: appEnvironment === 'production',
  isDesktopBuild: import.meta.env.TAURI_ENV_PLATFORM != null || import.meta.env.TAURI_PLATFORM != null,
  supabaseUrl,
  supabaseAnonKey: rawSupabaseAnonKey,
  supabaseUrlRef: supabaseUrl ? getSupabaseRefFromUrl(supabaseUrl) : null,
  supabaseKeyRef: rawSupabaseAnonKey ? getSupabaseRefFromAnonKey(rawSupabaseAnonKey) : null,
  isSupabaseConfigured: Boolean(supabaseUrl && rawSupabaseAnonKey),
  supabaseConfigError:
    supabaseUrl && rawSupabaseAnonKey
      ? validateSupabaseEnv(supabaseUrl, rawSupabaseAnonKey)
      : null,
  isAiEnabled: (import.meta.env.VITE_AI_ENABLED ?? 'true') !== 'false',
  openAiApiKey: import.meta.env.VITE_OPENAI_API_KEY ?? '',
  openAiModel: import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini',
  isOpenAiConfigured: Boolean(import.meta.env.VITE_OPENAI_API_KEY?.trim()),
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  isGoogleCalendarConfigured: Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()),
  /** Endpoint futur pour tauri-plugin-updater (voir docs/DESKTOP_PRODUCTION.md). */
  updaterEndpoint: import.meta.env.VITE_UPDATER_ENDPOINT ?? '',
  /** URL publique du portail client (Vercel). */
  portalPublicUrl: (import.meta.env.VITE_PORTAL_PUBLIC_URL ?? '').replace(/\/+$/, ''),
  isPortalStandalone: import.meta.env.VITE_PORTAL_STANDALONE === 'true',
  isPortalWeb: import.meta.env.VITE_PORTAL_STANDALONE === 'true' && !import.meta.env.TAURI_ENV_PLATFORM,
} as const
