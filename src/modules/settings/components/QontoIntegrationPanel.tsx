import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { getQontoAppUrl, saveQontoAppUrl } from '@/services/settings/qonto-settings.service'
import { env } from '@/config/env'
import { toast } from '@/store/toast.store'

export function QontoIntegrationPanel() {
  const [url, setUrl] = useState(env.qontoAppUrl)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getQontoAppUrl().then(setUrl)
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await saveQontoAppUrl(url)
      toast.success('Qonto configuré', 'URL enregistrée pour le bouton « Ouvrir Qonto ».')
    } catch {
      toast.error('Erreur', 'Impossible d’enregistrer l’URL Qonto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card
      title="Facturation Qonto"
      description="AT72Manager ne génère plus de devis/factures légaux — utilisez Qonto pour la comptabilité."
      animated
    >
      <div className="space-y-4">
        <Input
          label="URL Qonto (bouton « Ouvrir Qonto »)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://app.qonto.com"
        />
        <p className="text-xs text-text-muted">
          Sur chaque intervention : acompte, statut paiement, référence facture externe et lien
          document.
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Card>
  )
}
