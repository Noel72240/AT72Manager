import { env } from '@/config/env'
import type { TableName } from '@/services/supabase/types'
import { getSupabaseClient, requireSupabaseClient, ensureSupabaseClient } from '@/services/supabase/client'
import { withWorkshopId } from '@/services/database/workshop-context'

export class DatabaseError extends Error {
  cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'DatabaseError'
    this.cause = cause
  }
}

const WORKSHOP_SCOPED_TABLES = new Set<TableName>([
  'clients',
  'devices',
  'interventions',
  'quotes',
  'invoices',
  'spare_parts',
  'stock_movements',
  'activity_feed',
])

function assertOnline() {
  if (!navigator.onLine) {
    throw new DatabaseError('Mode hors ligne — opération reportée.')
  }
}

function isSingleRowCoerceError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)
  return (
    message.includes('Cannot coerce the result to a single JSON object') ||
    message.includes('JSON object requested, multiple') ||
    message.includes('Results contain 0 rows')
  )
}

async function enrichWorkshopId(
  table: TableName,
  payload: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (!WORKSHOP_SCOPED_TABLES.has(table)) {
    return payload
  }

  let row = withWorkshopId(payload)

  if (row.workshop_id != null) {
    return row
  }

  const client = getSupabaseClient()
  if (!client) return row

  const {
    data: { session },
  } = await client.auth.getSession()
  const uid = session?.user?.id
  if (!uid) return row

  const { data: profile } = await client
    .from('profiles')
    .select('workshop_id')
    .eq('id', uid)
    .maybeSingle()

  if (profile?.workshop_id) {
    row = { ...row, workshop_id: profile.workshop_id }
  }

  return row
}

export const databaseService = {
  isAvailable(): boolean {
    return env.isSupabaseConfigured && navigator.onLine
  },

  getClient() {
    return getSupabaseClient()
  },

  from<T extends TableName>(table: T) {
    assertOnline()
    return requireSupabaseClient().from(table)
  },

  async insert<T extends TableName>(
    table: T,
    payload: Record<string, unknown>,
  ) {
    assertOnline()
    await ensureSupabaseClient()
    const enriched = await enrichWorkshopId(table, payload)

    const { data, error } = await requireSupabaseClient()
      .from(table)
      .insert(enriched as never)
      .select()
      .maybeSingle()

    if (error) {
      if (isSingleRowCoerceError(error)) {
        return enriched
      }
      throw new DatabaseError(error.message, error)
    }

    return data ?? enriched
  },

  async update<T extends TableName>(
    table: T,
    id: string,
    payload: Record<string, unknown>,
  ) {
    assertOnline()
    await ensureSupabaseClient()
    const enriched = await enrichWorkshopId(table, payload)

    const { data, error } = await requireSupabaseClient()
      .from(table)
      .update(enriched as never)
      .eq('id' as never, id)
      .select()
      .maybeSingle()

    if (error) {
      if (isSingleRowCoerceError(error)) {
        return { id, ...enriched }
      }
      throw new DatabaseError(error.message, error)
    }

    return data ?? { id, ...enriched }
  },

  async remove<T extends TableName>(table: T, id: string) {
    assertOnline()
    await ensureSupabaseClient()
    const { error } = await requireSupabaseClient()
      .from(table)
      .delete()
      .eq('id' as never, id)
    if (error) throw new DatabaseError(error.message, error)
  },

  async list<T extends TableName>(table: T) {
    assertOnline()
    await ensureSupabaseClient()
    const { data, error } = await requireSupabaseClient()
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new DatabaseError(error.message, error)
    return data ?? []
  },

  async getById<T extends TableName>(table: T, id: string) {
    assertOnline()
    await ensureSupabaseClient()
    const { data, error } = await requireSupabaseClient()
      .from(table)
      .select('*')
      .eq('id' as never, id)
      .maybeSingle()

    if (error) {
      if (isSingleRowCoerceError(error)) {
        throw new DatabaseError('Enregistrement introuvable ou accès refusé (RLS).', error)
      }
      throw new DatabaseError(error.message, error)
    }

    if (!data) {
      throw new DatabaseError('Enregistrement introuvable ou accès refusé (RLS).')
    }

    return data
  },
}
