export function formatPrice(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
}
