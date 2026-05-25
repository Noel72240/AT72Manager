/** Flags plateforme & évolution SaaS multi-atelier. */
export type PlatformFeatureFlags = {
  multiWorkshop: boolean
  multiTenant: boolean
  clientPortal: boolean
  mobileTechnicianApp: boolean
  geolocation: boolean
  cloudAi: boolean
  multiDeviceSync: boolean
  licensing: boolean
  subscriptions: boolean
  whiteLabel: boolean
  pushNotifications: boolean
  mfa: boolean
  advancedCollaboration: boolean
}

export const PLATFORM_FEATURE_FLAGS: PlatformFeatureFlags = {
  multiWorkshop: false,
  multiTenant: false,
  clientPortal: true,
  mobileTechnicianApp: false,
  geolocation: false,
  cloudAi: false,
  multiDeviceSync: true,
  licensing: false,
  subscriptions: false,
  whiteLabel: false,
  pushNotifications: true,
  mfa: false,
  advancedCollaboration: true,
}

export type TenantContext = {
  workshopId: string
  organizationId?: string
  plan?: 'starter' | 'pro' | 'enterprise'
}

export type LicenseInfo = {
  tier: 'internal' | 'starter' | 'pro' | 'enterprise'
  validUntil?: string
  seats?: number
}
