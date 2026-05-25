import { Calendar, CreditCard, Smartphone, Sparkles, Bell } from 'lucide-react'
import { PORTAL_FUTURE_FEATURES } from '@/types/portal.types'

const ITEMS = [
  { key: 'onlinePayment' as const, label: 'Paiement en ligne', icon: CreditCard },
  { key: 'onlineBooking' as const, label: 'RDV en ligne', icon: Calendar },
  { key: 'pushNotifications' as const, label: 'Notifications push', icon: Bell },
  { key: 'clientMobileApp' as const, label: 'App mobile client', icon: Smartphone },
  { key: 'aiClientSupport' as const, label: 'Assistant IA', icon: Sparkles },
]

export function PortalFutureFeatures() {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        Bientôt disponible
      </p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {ITEMS.map(({ key, label, icon: Icon }) => (
          <li
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/60 px-3 py-1.5 text-[11px] text-text-secondary"
            title={PORTAL_FUTURE_FEATURES[key] ? 'Activé' : 'Prévu'}
          >
            <Icon className="size-3 opacity-60" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
