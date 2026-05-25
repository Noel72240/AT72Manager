import { useState } from 'react'
import { Send } from 'lucide-react'
import { usePortalAuthStore } from '@/store/portal-auth.store'
import { usePortalDataStore } from '@/store/portal-data.store'
import { portalApiService } from '@/services/portal/portal-api.service'
import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export function PortalMessagesPage() {
  const session = usePortalAuthStore((s) => s.session)
  const messages = usePortalDataStore((s) => s.messages)
  const refresh = usePortalDataStore((s) => s.refresh)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function send() {
    if (!session || !body.trim()) return
    setSending(true)
    try {
      await portalApiService.sendMessage({
        clientId: session.clientId,
        workshopId: session.workshopId,
        body,
        senderName: session.fullName,
      })
      setBody('')
      await refresh(session.clientId)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="portal-page portal-safe-bottom mx-auto flex max-w-2xl flex-col p-4 pb-12 lg:h-[calc(100vh-4rem)] lg:p-8">
      <h1 className="mb-4 text-2xl font-semibold text-text-primary">Messagerie atelier</h1>

      <div className="flex min-h-[320px] flex-1 flex-col rounded-2xl border border-border bg-surface-elevated">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-text-muted">Aucun message. Écrivez à votre atelier.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                  msg.senderType === 'client'
                    ? 'ml-auto bg-neon-blue/15 text-text-primary'
                    : 'mr-auto border border-border bg-background text-text-secondary',
                )}
              >
                {msg.senderType === 'workshop' && msg.senderName ? (
                  <p className="mb-1 text-[10px] font-semibold uppercase text-neon-blue">
                    {msg.senderName}
                  </p>
                ) : null}
                <p>{msg.body}</p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {new Date(msg.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <input
            className="portal-input flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-neon-blue/50"
            placeholder="Votre message…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void send()}
          />
          <Button size="sm" loading={sending} onClick={() => void send()} disabled={!body.trim()}>
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
