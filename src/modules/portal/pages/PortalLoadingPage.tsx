import { BrandLogoMark } from '@/components/brand/BrandLogoMark'

export function PortalLoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <BrandLogoMark size="lg" glow className="drop-shadow-[0_4px_24px_rgba(0,207,255,0.3)]" />
        <p className="text-sm text-text-muted">Chargement de votre espace…</p>
      </div>
    </div>
  )
}
