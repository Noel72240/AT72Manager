import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut, Settings, Shield, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import { UserAvatar } from '@/modules/users/components/UserAvatar'
import { auditService } from '@/services/audit/audit.service'
import { formatUserRole, toast, useAuthStore } from '@/store'
import { cn } from '@/utils/cn'
import { smoothTransition } from '@/utils/motion'
import type { AuditLogEntry } from '@/types/audit.types'

type UserProfilePanelProps = {
  className?: string
}

export function UserProfilePanel({ className }: UserProfilePanelProps) {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [open, setOpen] = useState(false)
  const [recentActivity, setRecentActivity] = useState<AuditLogEntry[]>([])

  useEffect(() => {
    if (!open || !user?.workshopId) return
    void auditService.list(user.workshopId, 5).then(setRecentActivity)
  }, [open, user?.workshopId])

  if (!user) return null

  async function handleSignOut() {
    try {
      await signOut()
      toast.info('Déconnexion', 'À bientôt sur AT72Manager')
      navigate(ROUTES.LOGIN, { replace: true })
    } catch {
      toast.error('Erreur', 'Impossible de se déconnecter')
    }
  }

  return (
    <div className={cn('relative', className)}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-elevated/60 py-1.5 pl-1.5 pr-3 transition-colors hover:border-neon-blue/20"
        aria-label="Profil utilisateur"
        aria-expanded={open}
      >
        <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
        <div className="hidden text-left sm:block">
          <p className="text-xs font-medium text-text-primary">{user.fullName}</p>
          <p className="text-[10px] text-text-muted">{formatUserRole(user.role)}</p>
        </div>
        <ChevronDown className="hidden size-3.5 text-text-muted sm:block" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(4px)' }}
            transition={smoothTransition}
            className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-card glass-elevated"
          >
            <motion.div
              className="border-b border-border-subtle bg-linear-to-br from-neon-blue/8 to-transparent p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3">
                <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-text-primary">{user.fullName}</p>
                  <p className="truncate text-xs text-text-muted">{user.email}</p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-muted px-2 py-0.5 text-[10px] font-medium text-neon-blue ring-1 ring-neon-blue/20">
                    <Shield className="size-3" />
                    {formatUserRole(user.role)}
                  </span>
                </div>
              </div>
            </motion.div>

            <div className="p-3">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Activité récente
              </p>
              <ul className="max-h-32 space-y-1 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <li className="px-1 text-xs text-text-muted">Aucune action récente</li>
                ) : (
                  recentActivity.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg px-2 py-1.5 text-xs text-text-secondary hover:bg-surface-hover"
                    >
                      <span className="text-text-primary">{entry.summary}</span>
                      <span className="mt-0.5 block text-[10px] text-text-muted">
                        {new Date(entry.createdAt).toLocaleString('fr-FR')}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="border-t border-border-subtle p-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(ROUTES.SETTINGS)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
              >
                <Settings className="size-4" />
                Paramètres
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(`${ROUTES.SETTINGS}?tab=team`)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
              >
                <UserRound className="size-4" />
                Équipe & accès
              </button>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary transition hover:bg-surface-hover hover:text-text-primary"
              >
                <LogOut className="size-4" />
                Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
