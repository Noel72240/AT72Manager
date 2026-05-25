export function splitClientName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { firstName: '', lastName: '' }

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0] ?? '', lastName: '' }

  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

export function joinClientName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
}

export function getClientFullName(client: {
  firstName: string
  lastName: string
}): string {
  return joinClientName(client.firstName, client.lastName)
}
