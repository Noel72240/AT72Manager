export function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`

  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `Il y a ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `Il y a ${diffDays} j`

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}
