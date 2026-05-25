import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { portalInboxService } from '@/services/portal/portal-inbox.service'
import { clientsRepository } from '@/services/database/repositories/clients.repository'
import { getClientFullName } from '@/modules/clients/utils/client-name'
import type { Client } from '@/types/entities'
import type { PortalMessage } from '@/types/portal.types'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function WorkshopPortalInboxPage() {
  const user = useAuthStore((s) => s.user)
  const workshopId = user?.workshopId
  const [clients, setClients] = useState<Client[]>([])
  const [messages, setMessages] = useState<PortalMessage[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    if (!workshopId) return
    setLoading(true)
    try {
      const [clientList, msgs] = await Promise.all([
        clientsRepository.list(),
        portalInboxService.listForWorkshop(workshopId),
      ])
      setClients(clientList)
      setMessages(msgs)
      if (!selectedClientId && clientList.length > 0) {
        const withMsg = clientList.find((c) => msgs.some((m) => m.clientId === c.id))
        setSelectedClientId(withMsg?.id ?? clientList[0].id)
      }
    } finally {
      setLoading(false)
    }
  }, [workshopId, selectedClientId])

  useEffect(() => {
    void load()
  }, [load])

  const thread = useMemo(
    () => messages.filter((m) => m.clientId === selectedClientId),
    [messages, selectedClientId],
  )

  const unreadByClient = useMemo(() => {
    const map = new Map<string, number>()
    for (const m of messages) {
      if (m.senderType === 'client' && !m.readAt) {
        map.set(m.clientId, (map.get(m.clientId) ?? 0) + 1)
      }
    }
    return map
  }, [messages])

  useEffect(() => {
    if (!selectedClientId || !workshopId) return
    void portalInboxService.markClientMessagesRead(selectedClientId, workshopId).then(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientId === selectedClientId && m.senderType === 'client' && !m.readAt
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        ),
      )
    })
  }, [selectedClientId, workshopId])

  async function send() {
    if (!workshopId || !selectedClientId || !body.trim() || !user) return
    setSending(true)
    try {
      await portalInboxService.sendFromWorkshop({
        workshopId,
        clientId: selectedClientId,
        body,
        senderName: user.fullName,
      })
      const { portalInviteService } = await import('@/services/portal/portal-invite.service')
      await portalInviteService.notifyClientOnMessage({ clientId: selectedClientId, workshopId })
      setBody('')
      await load()
    } finally {
      setSending(false)
    }
  }

  if (!workshopId) {
    return (
      <p className="p-8 text-sm text-text-muted">
        Atelier non configuré sur votre profil. Exécutez les migrations Supabase workshop.
      </p>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-4 lg:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-text-primary">
          <MessageCircle className="size-6 text-neon-blue" />
          Messages portail client
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Les messages envoyés depuis le portail client (`/#/portal/messages`) apparaissent ici.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-border p-2">
          {loading ? (
            <p className="p-2 text-xs text-text-muted">Chargement…</p>
          ) : clients.length === 0 ? (
            <p className="p-2 text-xs text-text-muted">Aucun client</p>
          ) : (
            clients.map((c) => {
              const unread = unreadByClient.get(c.id) ?? 0
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedClientId(c.id)}
                  className={cn(
                    'mb-1 flex w-full flex-col rounded-lg px-3 py-2 text-left text-sm transition',
                    selectedClientId === c.id
                      ? 'bg-neon-blue/15 text-neon-blue'
                      : 'hover:bg-surface-hover text-text-secondary',
                  )}
                >
                  <span className="font-medium text-text-primary">
                    {getClientFullName(c)}
                  </span>
                  {unread > 0 ? (
                    <span className="text-[11px] text-neon-blue">{unread} nouveau(x)</span>
                  ) : null}
                </button>
              )
            })
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {thread.length === 0 ? (
              <p className="text-center text-sm text-text-muted">
                Aucun message avec ce client.
              </p>
            ) : (
              thread.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    msg.senderType === 'workshop'
                      ? 'ml-auto bg-neon-blue/15 text-text-primary'
                      : 'mr-auto border border-border bg-background text-text-secondary',
                  )}
                >
                  {msg.senderType === 'client' ? (
                    <p className="mb-1 text-[10px] font-semibold uppercase text-neon-green">
                      Client
                    </p>
                  ) : (
                    <p className="mb-1 text-[10px] text-text-muted">Atelier</p>
                  )}
                  <p>{msg.body}</p>
                  <p className="mt-1 text-[10px] text-text-muted">
                    {new Date(msg.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              ))
            )}
          </div>

          {selectedClientId ? (
            <div className="flex gap-2 border-t border-border p-3">
              <input
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-blue/50"
                placeholder="Répondre au client…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
              />
              <Button size="sm" loading={sending} disabled={!body.trim()} onClick={() => void send()}>
                <Send className="size-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
