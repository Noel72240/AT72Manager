import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { UserAvatar } from '@/modules/users/components/UserAvatar'
import { formatUserRole, useAuthStore } from '@/store'
import { USER_ROLES } from '@/types/permissions.types'
import type { UserRole } from '@/types/user.types'
import { fadeInUp } from '@/utils/motion'

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  manager: 'Responsable',
  technician: 'Technicien',
  readonly: 'Lecture seule',
}

export function TeamMembersPanel() {
  const user = useAuthStore((state) => state.user)
  const teamMembers = useAuthStore((state) => state.teamMembers)
  const updateMemberRole = useAuthStore((state) => state.updateMemberRole)
  const canManage = user?.role === 'admin'

  return (
    <motion.section variants={fadeInUp} className="space-y-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="flex size-10 items-center justify-center rounded-xl bg-primary-muted ring-1 ring-neon-blue/25"
          whileHover={{ scale: 1.03 }}
        >
          <Users className="size-5 text-neon-blue" />
        </motion.div>
        <motion.div>
          <h2 className="text-lg font-semibold text-text-primary">Équipe atelier</h2>
          <p className="text-sm text-text-muted">
            Gestion collaborative — rôles, accès et préparation invités / MFA.
          </p>
        </motion.div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface-elevated/60">
        <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-muted sm:grid-cols-[1fr_140px_120px]">
          <span>Membre</span>
          <span className="hidden sm:block">Rôle</span>
          <span className="text-right">Statut</span>
        </div>

        <ul className="divide-y divide-border/50">
          {teamMembers.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-text-muted">
              Aucun membre chargé — vérifiez la connexion Supabase et la migration RBAC.
            </li>
          ) : (
            teamMembers.map((member, index) => (
              <motion.li
                key={member.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_140px_120px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar name={member.fullName} avatarUrl={member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-text-primary">{member.fullName}</p>
                    <p className="truncate text-xs text-text-muted">{member.email}</p>
                  </div>
                </div>

                {canManage && member.userId !== user?.id ? (
                  <select
                    value={member.role}
                    onChange={(event) =>
                      void updateMemberRole(member.userId, event.target.value as UserRole)
                    }
                    className="hidden rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary sm:block"
                  >
                    {USER_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="hidden text-sm text-text-secondary sm:block">
                    {formatUserRole(member.role)}
                  </span>
                )}

                <span className="justify-self-end rounded-full bg-accent-muted/40 px-2 py-0.5 text-[10px] font-medium text-neon-green ring-1 ring-neon-green/20">
                  {member.status === 'active' ? 'Actif' : member.status}
                </span>
              </motion.li>
            ))
          )}
        </ul>
      </div>

      {!canManage && (
        <p className="text-xs text-text-muted">
          Seul un administrateur peut modifier les rôles. Contactez votre responsable atelier.
        </p>
      )}
    </motion.section>
  )
}
