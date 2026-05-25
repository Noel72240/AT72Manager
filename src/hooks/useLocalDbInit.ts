import { useEffect, useRef } from 'react'
import { getLastDbInitResult } from '@/services/indexeddb/db'
import { toast } from '@/store/toast.store'
import { formatSupabaseError } from '@/utils/format-supabase-error'

/** Toasts post-migration — la DB est initialisée par useStartup. */
export function useLocalDbInit() {
  const notifiedRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (notifiedRef.current) return
      notifiedRef.current = true
      const result = getLastDbInitResult()
      if (!result) return

      if (result.status === 'rebuilt') {
        toast.info(
          'Base locale reconstruite',
          'Migration IndexedDB réussie. Vos données seront resynchronisées depuis Supabase.',
        )
        return
      }

      if (result.status === 'degraded') {
        toast.warning(
          'Mode dégradé',
          formatSupabaseError(result.message ?? 'Base locale indisponible — mode cloud uniquement.'),
        )
      }
    }, 800)

    return () => window.clearTimeout(timer)
  }, [])
}
