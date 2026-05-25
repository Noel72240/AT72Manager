const DAY_MS = 86_400_000

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

/** Lundi = début de semaine */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function endOfWeek(date: Date): Date {
  return endOfDay(addDays(startOfWeek(date), 6))
}

export function startOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfMonth(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  d.setHours(23, 59, 59, 999)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function getMonthGrid(anchor: Date): Date[] {
  const monthStart = startOfMonth(anchor)
  const gridStart = startOfWeek(monthStart)
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

export function getViewRange(view: 'day' | 'week' | 'month', anchor: Date): { start: Date; end: Date } {
  if (view === 'day') {
    return { start: startOfDay(anchor), end: endOfDay(anchor) }
  }
  if (view === 'week') {
    return { start: startOfWeek(anchor), end: endOfWeek(anchor) }
  }
  const grid = getMonthGrid(anchor)
  return { start: startOfDay(grid[0]), end: endOfDay(grid[grid.length - 1]) }
}

export function formatCalendarTitle(view: 'day' | 'week' | 'month', anchor: Date): string {
  if (view === 'day') {
    return anchor.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'week') {
    const start = startOfWeek(anchor)
    const end = endOfWeek(anchor)
    const sameMonth = start.getMonth() === end.getMonth()
    const startStr = start.toLocaleDateString('fr-FR', { day: 'numeric', month: sameMonth ? undefined : 'short' })
    const endStr = end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${startStr} – ${endStr}`
  }
  return anchor.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}

export function formatTime(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocalValue(value: string): Date {
  return new Date(value)
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS)
}
