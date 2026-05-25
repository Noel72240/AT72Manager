import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, Search } from 'lucide-react'
import {
  COMMAND_ITEMS,
  useCommandPaletteStore,
  type CommandItem,
} from '@/store/command-palette.store'
import { useSyncStore } from '@/store/sync.store'
import { cn } from '@/utils/cn'

function filterCommands(query: string, recentIds: string[]): CommandItem[] {
  const q = query.trim().toLowerCase()
  const base = q
    ? COMMAND_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.keywords?.toLowerCase().includes(q),
      )
  : COMMAND_ITEMS

  const recentSet = new Set(recentIds)
  return [...base].sort((a, b) => {
    const ar = recentSet.has(a.id) ? 0 : 1
    const br = recentSet.has(b.id) ? 0 : 1
    return ar - br || a.label.localeCompare(b.label, 'fr')
  })
}

export function CommandPalette() {
  const navigate = useNavigate()
  const open = useCommandPaletteStore((s) => s.open)
  const query = useCommandPaletteStore((s) => s.query)
  const recent = useCommandPaletteStore((s) => s.recent)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const setQuery = useCommandPaletteStore((s) => s.setQuery)
  const pushRecent = useCommandPaletteStore((s) => s.pushRecent)
  const sync = useSyncStore((s) => s.sync)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const dynamicItems = useMemo<CommandItem[]>(
    () => [
      {
        id: 'action-sync',
        label: 'Synchroniser le cloud',
        group: 'Actions',
        keywords: 'sync supabase sauvegarde',
        action: () => void sync(),
      },
    ],
    [sync],
  )

  const items = useMemo(() => {
    const filtered = filterCommands(query, recent)
    const dynamic = dynamicItems.filter(
      (d) =>
        !query.trim() ||
        d.label.toLowerCase().includes(query.toLowerCase()) ||
        d.keywords?.toLowerCase().includes(query.toLowerCase()),
    )
    return [...filtered, ...dynamic]
  }, [query, recent, dynamicItems])

  useEffect(() => {
    if (open) {
      setActiveIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  async function runItem(item: CommandItem) {
    pushRecent(item.id)
    setOpen(false)
    setQuery('')
    if (item.action) await item.action()
    else if (item.href) navigate(item.href)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && items[activeIndex]) {
      event.preventDefault()
      void runItem(items[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 p-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-border/80 bg-surface-elevated/95 shadow-2xl ring-1 ring-neon-blue/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <motion.div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Command className="size-4 text-neon-blue" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une page ou action…"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <kbd className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] text-text-muted">
                Esc
              </kbd>
            </motion.div>

            <ul className="max-h-[min(420px,50vh)] overflow-y-auto p-2">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-text-muted">Aucun résultat</li>
              ) : (
                items.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                        index === activeIndex
                          ? 'bg-primary-muted/40 text-text-primary'
                          : 'text-text-secondary hover:bg-surface-hover/60',
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => void runItem(item)}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-muted">
                        {item.group}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>

            <div className="flex items-center gap-2 border-t border-border/60 px-4 py-2 text-[10px] text-text-muted">
              <Search className="size-3" />
              ↑↓ naviguer · Entrée ouvrir · Ctrl+K
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
