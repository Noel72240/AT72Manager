import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react'
import { env } from '@/config/env'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/ui/Logo'
import { AuthError } from '@/services/auth/auth.service'
import { toast, useAuthStore } from '@/store'

export function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Connexion réussie', 'Bienvenue sur AT72Manager')
    } catch (err) {
      const message =
        err instanceof AuthError ? err.message : 'Impossible de se connecter.'
      setError(message)
      toast.error('Échec de connexion', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -left-32 top-0 size-[420px] rounded-full bg-neon-blue/10 blur-3xl" />
        <motion.div className="absolute bottom-0 right-0 size-[520px] rounded-full bg-neon-green/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,207,255,0.08),transparent_45%)]" />
      </div>

      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        <section className="flex flex-1 flex-col justify-between p-8 lg:p-12">
          <Logo size="md" showSubtitle />

          <div className="my-10 max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl"
            >
              Gérez vos interventions
              <span className="gradient-text"> en toute sérénité</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-sm leading-relaxed text-text-secondary"
            >
              Plateforme sécurisée pour le suivi clients, appareils et interventions AT72 —
              avec synchronisation cloud et mode hors ligne.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 space-y-3"
            >
              {[
                'Authentification Supabase sécurisée',
                'Données chiffrées et session persistante',
                'Mode offline avec synchronisation automatique',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <ShieldCheck className="size-4 text-neon-green" strokeWidth={1.75} />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-xs text-text-muted">© {new Date().getFullYear()} AT72Manager</p>
        </section>

        <section className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated/70 p-8 shadow-card glass-elevated"
          >
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-text-primary">Connexion</h2>
              <p className="mt-1 text-sm text-text-muted">
                Accédez à votre espace professionnel
              </p>
            </div>

            {!env.isSupabaseConfigured && (
              <div className="mb-6 rounded-xl border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
                Supabase n&apos;est pas configuré. Copiez <code>.env.example</code> vers{' '}
                <code>.env</code> et renseignez vos clés API.
              </div>
            )}

            {env.supabaseConfigError && (
              <motion.div className="mb-6 rounded-xl border border-danger/25 bg-danger/10 p-4 text-sm text-danger">
                {env.supabaseConfigError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.fr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={loading || !env.isSupabaseConfigured || !!env.supabaseConfigError}
              />

              <Input
                label="Mot de passe"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={loading || !env.isSupabaseConfigured || !!env.supabaseConfigError}
              />

              {error && (
                <p className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs text-danger">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="mt-2 w-full"
                size="lg"
                loading={loading}
                disabled={!env.isSupabaseConfigured || !!env.supabaseConfigError}
                rightIcon={<ArrowRight className="size-4" />}
              >
                Se connecter
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                SSO bientôt
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="size-3.5" />
                Session chiffrée
              </span>
            </div>

            <p className="mt-4 text-center text-xs text-text-muted">
              Vous êtes client ?{' '}
              <Link to={PORTAL_ROUTES.LOGIN} className="font-medium text-neon-blue hover:underline">
                Accéder au portail SAV
              </Link>
            </p>
          </motion.div>
        </section>
      </div>
    </motion.div>
  )
}
