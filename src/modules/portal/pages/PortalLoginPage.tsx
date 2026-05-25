import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Mail, Shield } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { BrandLogoMark } from '@/components/brand/BrandLogoMark'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PortalAuthError } from '@/services/portal/portal-auth.service'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { toast } from '@/store/toast.store'
import { PortalLegalFooter } from '@/modules/portal/legal/components/PortalLegalFooter'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'
import { LEGAL } from '@/config/legal.constants'

export function PortalLoginPage() {
  usePortalPageMeta({
    title: 'Connexion',
    description: `Connectez-vous à votre espace client ${LEGAL.companyName}.`,
    robots: 'index, follow',
  })
  const navigate = useNavigate()
  const signIn = usePortalAuthStore((s) => s.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      toast.success('Bienvenue', 'Votre espace client est prêt.')
      navigate(PORTAL_ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      const msg = err instanceof PortalAuthError ? err.message : 'Connexion impossible.'
      setError(msg)
      toast.error('Connexion', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0a0c12]">
    <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(0,207,255,0.12),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogoMark size="lg" glow className="mb-4" />
          <BrandWordmark size="lg" centered className="justify-center" />
          <p className="mt-2 text-sm text-text-secondary">Portail client — suivi SAV en temps réel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-elevated rounded-2xl border border-border p-6 shadow-card"
        >
          <div className="mb-4 flex items-center gap-2 text-sm text-neon-blue">
            <Shield className="size-4" />
            Connexion sécurisée
          </div>

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
              <Mail className="size-3.5" /> Email
            </span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs text-text-muted">
              <Lock className="size-3.5" /> Mot de passe
            </span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

          <Button type="submit" className="w-full" loading={loading}>
            Accéder à mon espace
            <ArrowRight className="size-4" />
          </Button>

          <p className="mt-4 text-center text-xs text-text-muted">
            Première visite ?{' '}
            <Link to={PORTAL_ROUTES.REGISTER} className="text-neon-blue hover:underline">
              Créer mon compte avec le code atelier
            </Link>
          </p>
        </form>

        {!import.meta.env.VITE_PORTAL_STANDALONE ? (
          <p className="mt-6 text-center text-[11px] text-text-muted">
            <Link to="/login" className="hover:text-text-secondary">
              Accès atelier (personnel)
            </Link>
          </p>
        ) : null}

        <p className="mt-6 text-center text-[10px] leading-relaxed text-text-muted">
          <Link to={PORTAL_ROUTES.CGU} className="hover:text-neon-blue">
            CGU
          </Link>
          {' · '}
          <Link to={PORTAL_ROUTES.PRIVACY} className="hover:text-neon-blue">
            Confidentialité
          </Link>
        </p>
      </motion.div>
    </div>
    <PortalLegalFooter variant="compact" />
    </div>
  )
}
