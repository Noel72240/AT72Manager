import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandWordmark } from '@/components/brand/BrandWordmark'
import { PORTAL_ROUTES } from '@/config/portal.routes'
import { PortalLegalFooter } from '@/modules/portal/legal/components/PortalLegalFooter'

type PortalLegalPublicLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function PortalLegalPublicLayout({
  title,
  subtitle,
  children,
}: PortalLegalPublicLayoutProps) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(0,207,255,0.06),transparent)]" />

      <header className="relative z-20 border-b border-border bg-surface/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 lg:px-8">
          <Link to={PORTAL_ROUTES.LOGIN} className="shrink-0">
            <BrandWordmark size="sm" />
          </Link>
          <Link
            to={PORTAL_ROUTES.LOGIN}
            className="flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-neon-blue"
          >
            <ArrowLeft className="size-3.5" />
            Retour
          </Link>
        </div>
      </header>

      <main className="portal-page portal-safe-bottom relative z-10 flex-1">
        <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8 lg:py-12">
          <header className="mb-8 border-b border-border pb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </div>
      </main>

      <PortalLegalFooter />
    </div>
  )
}
