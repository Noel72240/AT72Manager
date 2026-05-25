import { useEffect } from 'react'
import { useSyncStore } from '@/store/sync.store'

export function useSyncInit() {
  const initialize = useSyncStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])
}
