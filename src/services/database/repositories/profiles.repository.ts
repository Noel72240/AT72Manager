import { getDb } from '@/services/indexeddb/db'
import { STORES } from '@/services/indexeddb/schema'
import type { ProfileRecord } from '@/types/workshop.types'
import type { UserRole } from '@/types/user.types'
import { USER_ROLES } from '@/types/permissions.types'
import { databaseService } from '@/services/database/database.service'

function parseRole(value: unknown): UserRole {
  if (typeof value === 'string' && USER_ROLES.includes(value as UserRole)) {
    return value as UserRole
  }
  return 'technician'
}

function mapRow(row: Record<string, unknown>, email = ''): ProfileRecord {
  return {
    id: row.id as string,
    email,
    fullName: (row.full_name as string | null) ?? 'Utilisateur',
    role: parseRole(row.role),
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    workshopId: (row.workshop_id as string | null) ?? (row.id as string),
    status: (row.status as ProfileRecord['status']) ?? 'active',
    lastSeenAt: (row.last_seen_at as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export const profilesRepository = {
  async getLocal(id: string): Promise<ProfileRecord | undefined> {
    const db = await getDb()
    return db.get(STORES.profiles, id)
  },

  async upsertLocal(profile: ProfileRecord): Promise<void> {
    const db = await getDb()
    await db.put(STORES.profiles, profile)
  },

  async listLocalByWorkshop(workshopId: string): Promise<ProfileRecord[]> {
    const db = await getDb()
    const all = await db.getAll(STORES.profiles)
    return all.filter((profile) => profile.workshopId === workshopId)
  },

  async fetchById(userId: string, email = ''): Promise<ProfileRecord | null> {
    const cached = await this.getLocal(userId)
    if (!databaseService.isAvailable()) return cached ?? null

    try {
      const { data, error } = await databaseService
        .from('profiles')
        .select('*')
        .eq('id' as never, userId)
        .maybeSingle()

      if (error) throw error
      if (!data) return cached ?? null

      const profile = mapRow(data as Record<string, unknown>, email)
      await this.upsertLocal(profile)
      return profile
    } catch {
      return cached ?? null
    }
  },

  async listWorkshopMembers(workshopId: string): Promise<ProfileRecord[]> {
    if (!databaseService.isAvailable()) {
      return this.listLocalByWorkshop(workshopId)
    }

    try {
      const { data, error } = await databaseService
        .from('profiles')
        .select('*')
        .eq('workshop_id' as never, workshopId)
        .order('full_name')

      if (error) throw error
      const profiles = (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
      await Promise.all(profiles.map((profile) => this.upsertLocal(profile)))
      return profiles
    } catch {
      return this.listLocalByWorkshop(workshopId)
    }
  },

  async updateRole(userId: string, role: UserRole): Promise<void> {
    if (databaseService.isAvailable()) {
      await databaseService.update('profiles', userId, { role })
    }
    const existing = await this.getLocal(userId)
    if (existing) {
      await this.upsertLocal({ ...existing, role, updatedAt: new Date().toISOString() })
    }
  },

  async touchLastSeen(userId: string): Promise<void> {
    const now = new Date().toISOString()
    if (databaseService.isAvailable()) {
      try {
        await databaseService.update('profiles', userId, { last_seen_at: now })
      } catch {
        /* offline ok */
      }
    }
    const existing = await this.getLocal(userId)
    if (existing) {
      await this.upsertLocal({ ...existing, lastSeenAt: now, updatedAt: now })
    }
  },
}
