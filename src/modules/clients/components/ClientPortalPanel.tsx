import { useCallback, useEffect, useState } from 'react'
import { Copy, ExternalLink, Shield } from 'lucide-react'
import { getPortalRegisterUrl } from '@/config/portal-public-url'
import { portalInviteService } from '@/services/portal/portal-invite.service'
import { Button } from '@/components/ui/Button'
import { toast } from '@/store/toast.store'

type ClientPortalPanelProps = {
  clientId: string
  clientEmail?: string
}

export function ClientPortalPanel({ clientId, clientEmail }: ClientPortalPanelProps) {
  const [enabled, setEnabled] = useState(false)
  const [accessCode, setAccessCode] = useState<string | undefined>()
  const [hasAccount, setHasAccount] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const status = await portalInviteService.getPortalStatus(clientId)
    setEnabled(status.enabled)
    setAccessCode(status.accessCode)
    setHasAccount(status.hasAccount)
  }, [clientId])

  useEffect(() => {
    void load()
  }, [load])

  async function enable() {
    setLoading(true)
    try {
      const { accessCode: code } = await portalInviteService.enablePortalAccess(clientId)
      setAccessCode(code)
      setEnabled(true)
      toast.success('Portail activé', 'Communiquez le code au client.')
    } catch (e) {
      toast.error('Erreur', e instanceof Error ? e.message : 'Activation impossible')
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    setLoading(true)
    try {
      await portalInviteService.disablePortalAccess(clientId)
      await load()
      toast.success('Portail désactivé')
    } catch (e) {
      toast.error('Erreur', e instanceof Error ? e.message : 'Désactivation impossible')
    } finally {
      setLoading(false)
    }
  }

  function copyCode() {
    if (!accessCode) return
    void navigator.clipboard.writeText(accessCode)
    toast.success('Copié', 'Code d’accès copié.')
  }

  const portalUrl = getPortalRegisterUrl()

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
        <Shield className="size-4 text-neon-blue" />
        Portail client SAV
      </div>
      <p className="mt-1 text-xs text-text-muted">
        Le client suit réparations, devis et factures en temps réel.
        {clientEmail ? ` Email : ${clientEmail}` : ''}
      </p>

      {enabled && accessCode ? (
        <div className="mt-4 space-y-3 rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-3">
          <p className="text-xs text-text-secondary">Code d&apos;accès inscription</p>
          <p className="font-mono text-lg font-bold tracking-widest text-neon-blue">{accessCode}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={copyCode}>
              <Copy className="size-3.5" />
              Copier
            </Button>
            <a
              href={portalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:border-neon-blue/40"
            >
              <ExternalLink className="size-3.5" />
              Ouvrir inscription
            </a>
          </div>
          {hasAccount ? (
            <p className="text-xs text-neon-green">Compte client lié</p>
          ) : (
            <p className="text-xs text-text-muted">En attente de création de compte par le client</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 flex gap-2">
        {!enabled ? (
          <Button size="sm" loading={loading} onClick={() => void enable()}>
            Activer le portail
          </Button>
        ) : (
          <Button size="sm" variant="ghost" loading={loading} onClick={() => void disable()}>
            Désactiver
          </Button>
        )}
      </div>
    </div>
  )
}
