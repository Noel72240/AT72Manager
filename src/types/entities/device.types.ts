/** État physique / cosmétique de l'appareil */
export type DeviceCondition =
  | 'new'
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'broken'
  | 'for_parts'

/** Extensions futures (photos, historique SAV, garanties, pièces, IA) */
export type DeviceMedia = {
  photos?: string[]
  serviceHistory?: string[]
  warrantyUrl?: string
  replacedParts?: string[]
  aiDiagnosticHint?: string
}

export type Device = {
  id: string
  clientId: string
  deviceType: string
  brand?: string
  model?: string
  serialNumber?: string
  imei?: string
  storageCapacity?: string
  color?: string
  condition: DeviceCondition
  notes?: string
  media?: DeviceMedia
  createdAt: string
  updatedAt: string
  userId: string
}

export type DeviceInsert = Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'media'>
export type DeviceUpdate = Partial<Omit<Device, 'id' | 'userId' | 'createdAt' | 'media'>>
