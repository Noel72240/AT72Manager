import type { UserRole } from '@/types/user.types'

export type Workshop = {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export type WorkshopMemberStatus = 'active' | 'inactive' | 'invited'

export type WorkshopMember = {
  id: string
  workshopId: string
  userId: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  status: WorkshopMemberStatus
  joinedAt: string
  lastSeenAt?: string
}

export type ProfileRecord = {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  workshopId: string
  status: WorkshopMemberStatus
  lastSeenAt?: string
  createdAt: string
  updatedAt: string
}
