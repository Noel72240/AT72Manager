import { AlertTriangle } from 'lucide-react'
import { env } from '@/config/env'

/** Affiché si le build Vercel n’a pas les variables Supabase (écran bloqué / vide). */
export function PortalSupabaseConfigBanner() {
  if (env.isSupabaseConfigured && !env.supabaseConfigError) return null

  return (
    <div
      role="alert"
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-200"
    >
      <p className="flex items-center justify-center gap-2 font-medium">
        <AlertTriangle className="size-4 shrink-0" />
        Configuration Supabase manquante sur ce déploiement
      </p>
      <p className="mt-1 text-xs text-amber-200/80">
        Ajoutez <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code> et{' '}
        <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code> dans Vercel →
        Environment Variables, puis redéployez.
      </p>
    </div>
  )
}
