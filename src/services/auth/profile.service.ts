import type { User } from '@supabase/supabase-js'
import { profilesRepository } from '@/services/database/repositories/profiles.repository'
import type { AppUser, UserRole } from '@/types/user.types'
import { USER_ROLES } from '@/types/permissions.types'
import type { ProfileRecord } from '@/types/workshop.types'

function parseRole(value: unknown): UserRole {
  if (typeof value === 'string' && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return 'technician'
}

export function mapSupabaseUserBase(user: User): AppUser {
  const metadata = user.user_metadata ?? {}
  const fullName =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    user.email?.split('@')[0] ||
    'Utilisateur'

  return {
    id: user.id,
    email: user.email ?? '',
    fullName,
    role: parseRole(metadata.role),
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
  }
}

export function mergeProfileIntoUser(base: AppUser, profile: ProfileRecord | null): AppUser {
  if (!profile) return base

  return {
    ...base,
    fullName: profile.fullName || base.fullName,
    role: profile.role,
    avatarUrl: profile.avatarUrl ?? base.avatarUrl,
    workshopId: profile.workshopId,
    lastSeenAt: profile.lastSeenAt,
    status: profile.status,
  }
}

export async function resolveAppUser(user: User): Promise<AppUser> {
  const base = mapSupabaseUserBase(user)
  const profile = await profilesRepository.fetchById(user.id, base.email)
  return mergeProfileIntoUser(base, profile)
}

export const profileService = {
  resolveAppUser,
  fetchById: profilesRepository.fetchById.bind(profilesRepository),
  listWorkshopMembers: profilesRepository.listWorkshopMembers.bind(profilesRepository),
  updateRole: profilesRepository.updateRole.bind(profilesRepository),
  touchLastSeen: profilesRepository.touchLastSeen.bind(profilesRepository),
}
