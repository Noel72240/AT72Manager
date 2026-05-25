import { BrandLogoMark } from '@/components/brand/BrandLogoMark'

export function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-14">
          <div className="absolute inset-0 animate-spin rounded-[18px] border-2 border-neon-blue/15 border-t-neon-blue/70" />
          <BrandLogoMark
            size="lg"
            className="relative drop-shadow-[0_4px_24px_rgba(0,207,255,0.25)]"
          />
        </div>
        <p className="text-sm text-text-muted">Chargement…</p>
      </div>
    </div>
  )
}
