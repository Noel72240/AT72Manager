import type { FormEvent } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { KeyRound, Mail, Lock } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PortalAuthError } from '@/services/portal/portal-auth.service'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { PortalLegalFooter } from '@/modules/portal/legal/components/PortalLegalFooter'
import { usePortalPageMeta } from '@/modules/portal/legal/hooks/usePortalPageMeta'
import { LEGAL } from '@/config/legal.constants'
import { toast } from '@/store/toast.store'

export function PortalRegisterPage() {
  usePortalPageMeta({
    title: 'Créer un compte',
    description: `Inscription à l’espace client ${LEGAL.companyName} avec votre code atelier.`,
    robots: 'index, follow',
  })

  const navigate = useNavigate()
  const signUp = usePortalAuthStore((s) => s.signUp)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      await signUp(email, password, accessCode)
      toast.success('Compte créé', 'Bienvenue sur votre portail SAV.')
      navigate(PORTAL_ROUTES.DASHBOARD, { replace: true })
    } catch (err) {
      const msg = err instanceof PortalAuthError ? err.message : 'Inscription impossible.'
      if (msg.includes('Compte créé avec succès') || msg.includes('confirmation')) {
        setSuccess(msg)
        toast.success('Compte créé', 'Vérifiez votre email puis connectez-vous.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6"
      >
        <BrandWordmark size="md" className="mb-2" />
        <p className="mb-6 text-sm text-text-secondary">
          Utilisez le code d&apos;accès fourni par votre atelier.
        </p>

        <label className="mb-3 block text-xs text-text-muted">
          <KeyRound className="mr-1 inline size-3.5" /> Code d&apos;accès atelier
          <Input
            className="mt-1 uppercase"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            placeholder="Ex. AB12CD34"
            required
          />
        </label>
        <label className="mb-3 block text-xs text-text-muted">
          <Mail className="mr-1 inline size-3.5" /> Email
          <Input
            className="mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="mb-4 block text-xs text-text-muted">
          <Lock className="mr-1 inline size-3.5" /> Mot de passe
          <Input
            className="mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>

        {success ? (
          <p className="mb-3 rounded-lg border border-neon-green/30 bg-neon-green/10 p-3 text-sm text-neon-green">
            {success}{' '}
            <Link to={PORTAL_ROUTES.LOGIN} className="font-medium underline">
              Se connecter
            </Link>
          </p>
        ) : null}
        {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="w-full" loading={loading}>
          Créer mon compte client
        </Button>

        <p className="mt-4 text-center text-xs text-text-muted">
          <Link to={PORTAL_ROUTES.LOGIN} className="text-neon-blue hover:underline">
            Déjà un compte ? Se connecter
          </Link>
        </p>

        <p className="mt-4 text-center text-[10px] leading-relaxed text-text-muted">
          En créant un compte, vous acceptez les{' '}
          <Link to={PORTAL_ROUTES.CGU} className="text-neon-blue hover:underline">
            CGU
          </Link>{' '}
          et la{' '}
          <Link to={PORTAL_ROUTES.PRIVACY} className="text-neon-blue hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>
      </motion.form>
    </div>
    <PortalLegalFooter variant="compact" />
    </div>
  )
}
