/** Traduit les erreurs Supabase courantes en messages utilisateur FR */
export function formatSupabaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('schema cache') || message.includes('Could not find')) {
    if (message.includes("'devices'") || message.includes('devices')) {
      return (
        'La table Supabase « devices » n\'a pas les colonnes SAV (brand, imei, device_type, etc.). ' +
        'Exécutez supabase/migrations/003_devices_sav.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'interventions'") || message.includes('interventions')) {
      return (
        'La table Supabase « interventions » n\'a pas les colonnes SAV. ' +
        'Exécutez supabase/migrations/002_interventions_sav.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes('duration_minutes') || message.includes('assigned_technician_id')) {
      return (
        'Colonnes planning manquantes sur « interventions ». ' +
        'Exécutez supabase/migrations/008_intervention_calendar.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'activity_feed'") || message.includes('activity_feed')) {
      return (
        'La table Supabase « activity_feed » est absente. ' +
        'Exécutez supabase/migrations/007_activity_feed.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'ai_conversations'") || message.includes('ai_conversations')) {
      return (
        'La table Supabase « ai_conversations » est absente. ' +
        'Exécutez supabase/migrations/009_ai_conversations.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'spare_parts'") || message.includes('spare_parts')) {
      return (
        'Les tables Supabase « spare_parts » / « stock_movements » sont absentes. ' +
        'Exécutez supabase/migrations/006_spare_parts_stock.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'quotes'") || message.includes('quotes')) {
      return (
        'Les tables Supabase « quotes » / « invoices » sont absentes. ' +
        'Exécutez supabase/migrations/005_quotes_invoices.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    if (message.includes("'invoices'") || message.includes('invoices')) {
      return (
        'La table Supabase « invoices » est absente. ' +
        'Exécutez supabase/migrations/005_quotes_invoices.sql dans le SQL Editor Supabase, puis réessayez.'
      )
    }

    return (
      'La base Supabase n\'a pas les colonnes SAV attendues. ' +
      'Exécutez les migrations 002_interventions_sav.sql et 003_devices_sav.sql dans le SQL Editor Supabase, puis réessayez.'
    )
  }

  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Connexion impossible au serveur. Vérifiez votre réseau ou réessayez hors ligne.'
  }

  if (
    message.includes('object stores was not found') ||
    message.includes('IndexedDB incomplet') ||
    message.includes('stores manquants')
  ) {
    return (
      'Base locale incomplète (migration IndexedDB requise). ' +
      'Rechargez l’application avec Ctrl+R, puis réessayez. ' +
      'Si le problème persiste, fermez toutes les fenêtres AT72Manager et relancez.'
    )
  }

  if (message.includes('JWT') || message.includes('401')) {
    return 'Session expirée. Reconnectez-vous.'
  }

  return message
}
