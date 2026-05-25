import { useEffect } from 'react'
import { useCommandPaletteStore } from '@/store/command-palette.store'

export function useKeyboardShortcuts(): void {
  const toggle = useCommandPaletteStore((s) => s.toggle)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isMod = event.ctrlKey || event.metaKey
      if (isMod && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        toggle()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])
}
