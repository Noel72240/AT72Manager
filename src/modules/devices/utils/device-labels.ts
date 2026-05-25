import type { Device, DeviceCondition } from '@/types/entities/device.types'
import type { BadgeVariant } from '@/theme/variants'

export const CONDITION_LABELS: Record<DeviceCondition, string> = {
  new: 'Neuf',
  excellent: 'Excellent',
  good: 'Bon état',
  fair: 'Correct',
  poor: 'Mauvais',
  broken: 'Cassé',
  for_parts: 'Pour pièces',
}

export const CONDITION_VARIANTS: Record<DeviceCondition, BadgeVariant> = {
  new: 'success',
  excellent: 'success',
  good: 'primary',
  fair: 'warning',
  poor: 'warning',
  broken: 'danger',
  for_parts: 'default',
}

export const ALL_CONDITIONS: DeviceCondition[] = [
  'new',
  'excellent',
  'good',
  'fair',
  'poor',
  'broken',
  'for_parts',
]

const TYPE_VARIANTS: Record<string, BadgeVariant> = {
  Téléphone: 'primary',
  Tablette: 'primary',
  'PC portable': 'default',
  'PC fixe': 'default',
  TV: 'warning',
  'Console de jeux': 'warning',
  'Montre connectée': 'primary',
  Imprimante: 'default',
  Autre: 'default',
}

export function normalizeDeviceCondition(value: string): DeviceCondition {
  const map: Record<string, DeviceCondition> = {
    new: 'new',
    excellent: 'excellent',
    good: 'good',
    fair: 'fair',
    poor: 'poor',
    broken: 'broken',
    for_parts: 'for_parts',
    operational: 'good',
    maintenance: 'fair',
    out_of_service: 'broken',
  }
  return map[value] ?? 'good'
}

export function getDeviceTypeVariant(deviceType: string): BadgeVariant {
  return TYPE_VARIANTS[deviceType] ?? 'default'
}

export function getDeviceSummary(device: Pick<Device, 'deviceType' | 'brand' | 'model'>) {
  const parts = [device.brand, device.model].filter(Boolean)
  if (parts.length === 0) return device.deviceType
  return `${device.deviceType} · ${parts.join(' ')}`
}

export const STORAGE_OPTIONS = [
  '8 Go',
  '16 Go',
  '32 Go',
  '64 Go',
  '128 Go',
  '256 Go',
  '512 Go',
  '1 To',
  '2 To',
] as const

export const COLOR_OPTIONS = [
  'Noir',
  'Blanc',
  'Gris',
  'Argent',
  'Or',
  'Bleu',
  'Vert',
  'Rouge',
  'Violet',
  'Rose',
  'Jaune',
  'Transparent',
] as const
