import type { StartupStatus } from '@/hooks/useStartup'
import { BrandLogoMark } from '@/components/brand/BrandLogoMark'
import { BrandWordmark } from '@/components/brand/BrandWordmark'

type StartupSplashProps = {
  progress: number
  phaseLabel: string
  subLabel: string | null
  status: StartupStatus
  version: string
}

/** Splash sans dépendance critique à Framer — rendu fiable dans WebView Tauri */
export function StartupSplash({
  progress,
  phaseLabel,
  subLabel,
  version,
}: StartupSplashProps) {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0c12] px-6"
      role="status"
      aria-live="polite"
      aria-label="Chargement AT72Manager"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_38%,rgba(0,207,255,0.12),transparent_70%)]"
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-8">
        <BrandLogoMark
          size="xl"
          className="drop-shadow-[0_8px_32px_rgba(0,207,255,0.3)]"
          glow
        />

        <div className="w-full text-center">
          <BrandWordmark size="xl" centered className="justify-center" />
          <p className="mt-2 text-sm text-[#8b92a8]">Suite atelier professionnelle</p>
        </div>

        <div className="h-12 w-full text-center">
          <p className="text-sm font-medium text-white">{phaseLabel}</p>
          {subLabel ? <p className="mt-1 text-xs text-[#8b92a8]">{subLabel}</p> : null}
        </div>

        <div className="w-full max-w-xs">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00cfff] to-[#00ff9f] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] tabular-nums text-[#8b92a8]">{progress}%</p>
        </div>

        <p className="text-[11px] uppercase tracking-[0.2em] text-[#5c6378]">
          v{version} · Desktop
        </p>
      </div>
    </div>
  )
}
