import { Link } from 'react-router-dom'
import { ExternalLink, Lock, Shield } from 'lucide-react'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { LEGAL } from '@/config/legal.constants'
import { cn } from '@/utils/cn'

type PortalLegalFooterProps = {
  variant?: 'full' | 'compact'
  className?: string
}

export function PortalLegalFooter({ variant = 'full', className }: PortalLegalFooterProps) {
  const legalLinks = [
    { to: PORTAL_ROUTES.MENTIONS_LEGALES, label: 'Mentions légales' },
    { to: PORTAL_ROUTES.PRIVACY, label: 'Confidentialité' },
    { to: PORTAL_ROUTES.CGU, label: 'CGU' },
  ] as const

  if (variant === 'compact') {
    return (
      <footer
        className={cn(
          'border-t border-border bg-surface/60 px-4 py-4 text-center backdrop-blur-sm',
          className,
        )}
      >
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-text-muted">
          {legalLinks.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-neon-blue">
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-text-muted">
          <Lock className="size-3" aria-hidden />
          Connexion sécurisée HTTPS
        </p>
      </footer>
    )
  }

  return (
    <footer
      className={cn(
        'relative z-10 mt-auto border-t border-border bg-surface/80 backdrop-blur-xl',
        className,
      )}
    >
      <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold tracking-wide text-text-primary">
              {LEGAL.companyName}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-text-muted">
              {LEGAL.activity}
              <br />
              {LEGAL.addressLine1}
              <br />
              {LEGAL.addressLine2}, {LEGAL.country}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Informations légales
            </p>
            <nav className="flex flex-col gap-2">
              {legalLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-sm text-text-secondary transition hover:text-neon-blue"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Contact & site
            </p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>
                <a href={LEGAL.emailHref} className="hover:text-neon-blue">
                  {LEGAL.email}
                </a>
              </li>
              <li>
                <a
                  href={LEGAL.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-neon-blue"
                >
                  Site vitrine
                  <ExternalLink className="size-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="size-3.5 shrink-0 text-neon-green" aria-hidden />
            Données hébergées en cloud sécurisé (HTTPS). Conformité RGPD.
          </p>
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} {LEGAL.companyName} — SIREN {LEGAL.siren}
            <span className="mt-1 block text-[10px] opacity-70">
              Portail web · build {import.meta.env.VITE_APP_VERSION ?? '1.0.0'}
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}
