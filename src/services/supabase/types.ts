import type {
  ActivityFeedItem,
  Client,
  Device,
  Intervention,
  StockMovement,
} from '@/types/entities'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  status: Client['status']
  notes: string | null
  workshop_id: string | null
  portal_enabled: boolean
  portal_access_code: string | null
  created_at: string
  updated_at: string
  user_id: string
}

type ClientAccountRow = {
  id: string
  auth_user_id: string
  client_id: string
  workshop_id: string
  enabled: boolean
  invited_at: string
  last_login_at: string | null
  created_at: string
  updated_at: string
}

type PortalMessageRow = {
  id: string
  workshop_id: string
  client_id: string
  intervention_id: string | null
  sender_type: string
  sender_name: string | null
  body: string
  read_at: string | null
  created_at: string
}

type PortalNotificationRow = {
  id: string
  workshop_id: string
  client_id: string
  kind: string
  title: string
  body: string
  read_at: string | null
  metadata: Json | null
  created_at: string
}

type PortalRepairEventRow = {
  id: string
  intervention_id: string
  workshop_id: string
  client_id: string
  stage: string
  label: string
  note: string | null
  is_public: boolean
  created_at: string
  created_by: string | null
}

type PortalQuoteValidationRow = {
  id: string
  quote_id: string
  client_id: string
  workshop_id: string
  status: string
  signature_data: string | null
  client_note: string | null
  validated_at: string | null
  created_at: string
  updated_at: string
}

type PortalClientSignatureRow = {
  id: string
  client_id: string
  workshop_id: string
  intervention_id: string | null
  quote_id: string | null
  purpose: string
  signature_data: string
  signed_at: string
  created_at: string
}

type InterventionRow = {
  id: string
  client_id: string
  device_id: string | null
  device_label: string | null
  brand: string | null
  model: string | null
  imei_or_serial: string | null
  reported_issue: string | null
  diagnostic: string | null
  technician_notes: string | null
  status: Intervention['status']
  estimated_price: number | null
  final_price: number | null
  media: Json | null
  title: string | null
  description: string | null
  priority: string | null
  scheduled_at: string | null
  completed_at: string | null
  duration_minutes: number | null
  assigned_technician_id: string | null
  parts_lines: Json | null
  created_at: string
  updated_at: string
  user_id: string
}

type DeviceRow = {
  id: string
  client_id: string
  device_type: string | null
  brand: string | null
  model: string | null
  serial_number: string | null
  imei: string | null
  storage_capacity: string | null
  color: string | null
  condition: Device['condition'] | null
  notes: string | null
  media: Json | null
  name: string | null
  status: string | null
  location: string | null
  last_service_at: string | null
  created_at: string
  updated_at: string
  user_id: string
}

type ProfileRow = {
  id: string
  full_name: string | null
  role: string | null
  avatar_url: string | null
  workshop_id: string | null
  status: string | null
  last_seen_at: string | null
  created_at: string
  updated_at: string
}

type QuoteRow = {
  id: string
  number: string
  client_id: string
  intervention_id: string | null
  device_id: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  title: string | null
  notes: string | null
  lines: Json
  subtotal: number
  vat_total: number
  total: number
  valid_until: string | null
  converted_invoice_id: string | null
  created_at: string
  updated_at: string
  user_id: string
}

type SparePartRow = {
  id: string
  name: string
  category: string
  reference: string
  supplier: string | null
  purchase_price: number
  sale_price: number
  quantity: number
  min_threshold: number
  notes: string | null
  created_at: string
  updated_at: string
  user_id: string
}

type StockMovementRow = {
  id: string
  part_id: string
  movement_type: StockMovement['movementType']
  delta: number
  quantity_after: number
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_at: string
  user_id: string
}

type ActivityFeedRow = {
  id: string
  kind: ActivityFeedItem['kind']
  title: string
  message: string | null
  severity: ActivityFeedItem['severity']
  href: string | null
  entity_type: string | null
  entity_id: string | null
  dedupe_key: string | null
  read: boolean
  archived: boolean
  user_id: string
  created_at: string
}

type AiConversationRow = {
  id: string
  title: string
  messages: Json
  context_snapshot: Json | null
  user_id: string
  created_at: string
  updated_at: string
}

type InvoiceRow = {
  id: string
  number: string
  client_id: string
  intervention_id: string | null
  device_id: string | null
  quote_id: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'
  title: string | null
  notes: string | null
  lines: Json
  subtotal: number
  vat_total: number
  total: number
  due_date: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
  user_id: string
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: ClientRow
        Insert: Omit<ClientRow, 'id' | 'created_at' | 'updated_at' | 'portal_enabled' | 'portal_access_code'> & {
          portal_enabled?: boolean
          portal_access_code?: string | null
        }
        Update: Partial<Omit<ClientRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      interventions: {
        Row: InterventionRow
        Insert: Omit<InterventionRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InterventionRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      devices: {
        Row: DeviceRow
        Insert: Omit<DeviceRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DeviceRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>
        Relationships: []
      }
      quotes: {
        Row: QuoteRow
        Insert: Omit<QuoteRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<QuoteRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      invoices: {
        Row: InvoiceRow
        Insert: Omit<InvoiceRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InvoiceRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      spare_parts: {
        Row: SparePartRow
        Insert: Omit<SparePartRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SparePartRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      stock_movements: {
        Row: StockMovementRow
        Insert: Omit<StockMovementRow, 'id' | 'created_at'>
        Update: Partial<Omit<StockMovementRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      activity_feed: {
        Row: ActivityFeedRow
        Insert: Omit<ActivityFeedRow, 'id' | 'created_at'>
        Update: Partial<Omit<ActivityFeedRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      ai_conversations: {
        Row: AiConversationRow
        Insert: Omit<AiConversationRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AiConversationRow, 'id' | 'user_id' | 'created_at'>>
        Relationships: []
      }
      client_accounts: {
        Row: ClientAccountRow
        Insert: {
          auth_user_id: string
          client_id: string
          workshop_id: string
          enabled?: boolean
          last_login_at?: string | null
        }
        Update: Partial<Omit<ClientAccountRow, 'id' | 'auth_user_id' | 'client_id'>>
        Relationships: []
      }
      portal_messages: {
        Row: PortalMessageRow
        Insert: {
          workshop_id: string
          client_id: string
          intervention_id?: string | null
          sender_type: string
          sender_name?: string | null
          body: string
          read_at?: string | null
        }
        Update: Partial<Omit<PortalMessageRow, 'id' | 'created_at'>>
        Relationships: []
      }
      portal_notifications: {
        Row: PortalNotificationRow
        Insert: {
          workshop_id: string
          client_id: string
          kind: string
          title: string
          body: string
          metadata?: Json | null
          read_at?: string | null
        }
        Update: Partial<Omit<PortalNotificationRow, 'id' | 'created_at'>>
        Relationships: []
      }
      portal_repair_events: {
        Row: PortalRepairEventRow
        Insert: Omit<PortalRepairEventRow, 'id' | 'created_at'>
        Update: Partial<Omit<PortalRepairEventRow, 'id' | 'created_at'>>
        Relationships: []
      }
      portal_quote_validations: {
        Row: PortalQuoteValidationRow
        Insert: Omit<PortalQuoteValidationRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PortalQuoteValidationRow, 'id' | 'quote_id' | 'client_id'>>
        Relationships: []
      }
      portal_client_signatures: {
        Row: PortalClientSignatureRow
        Insert: Omit<PortalClientSignatureRow, 'id' | 'created_at' | 'signed_at'>
        Update: Partial<Omit<PortalClientSignatureRow, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      lookup_client_by_portal_code: {
        Args: { p_code: string }
        Returns: { client_id: string; workshop_id: string }[]
      }
      link_portal_client_account: {
        Args: {
          p_user_id: string
          p_client_id: string
          p_workshop_id: string
          p_access_code: string
        }
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type TableName = keyof Database['public']['Tables']
