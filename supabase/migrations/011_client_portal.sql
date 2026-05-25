-- Portail client AT72Manager — comptes, timeline, messagerie, notifications, validations
-- PRÉREQUIS : exécuter 012_multi_workshop_foundation.sql AVANT ce script
-- Idempotent

-- ─── Bootstrap d'urgence si 012 n'a pas été exécuté ───────────────────────────
create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text,
  owner_id uuid references auth.users (id) on delete set null,
  is_default boolean not null default false,
  plan_tier text not null default 'standard',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.clients add column if not exists workshop_id uuid references public.workshops (id) on delete set null;

insert into public.workshops (id, name, slug, is_default)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  'AT72Manager — Atelier principal',
  'atelier-principal',
  true
where not exists (select 1 from public.workshops)
on conflict (id) do nothing;

insert into public.workshops (id, name, owner_id, is_default)
select p.id, coalesce(p.full_name, 'Mon atelier'), p.id, true
from public.profiles p
where not exists (select 1 from public.workshops w where w.id = p.id)
on conflict (id) do nothing;

update public.profiles p
set workshop_id = coalesce(p.workshop_id, p.id)
where p.workshop_id is null;

update public.clients c
set workshop_id = coalesce(c.workshop_id, p.workshop_id, c.user_id)
from public.profiles p
where c.user_id = p.id and c.workshop_id is null;

-- Fonctions RLS minimales (no-op si 012 déjà appliqué — CREATE OR REPLACE)
create or replace function public.default_workshop_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.workshops order by is_default desc, created_at asc limit 1
$$;

create or replace function public.current_workshop_id()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare wid uuid;
begin
  if auth.uid() is null then return public.default_workshop_id(); end if;
  select workshop_id into wid from public.profiles where id = auth.uid();
  if wid is not null then return wid; end if;
  select id into wid from public.workshops where owner_id = auth.uid() or id = auth.uid() limit 1;
  if wid is not null then return wid; end if;
  return public.default_workshop_id();
end;
$$;

create or replace function public.workshop_row_visible(p_workshop_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.current_workshop_id() is not null then p_workshop_id = public.current_workshop_id()
    else p_user_id = auth.uid()
  end
$$;

-- ─── Portail client ───────────────────────────────────────────────────────────

alter table public.clients add column if not exists portal_access_code text;
alter table public.clients add column if not exists portal_enabled boolean not null default false;

create table if not exists public.client_accounts (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  client_id uuid not null unique references public.clients (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  enabled boolean not null default true,
  invited_at timestamptz not null default now(),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portal_repair_events (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.interventions (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  stage text not null,
  label text not null,
  note text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table if not exists public.portal_messages (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  intervention_id uuid references public.interventions (id) on delete set null,
  sender_type text not null check (sender_type in ('client', 'workshop')),
  sender_name text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_notifications (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.portal_quote_validations (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  signature_data text,
  client_note text,
  validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quote_id, client_id)
);

create table if not exists public.portal_client_signatures (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  intervention_id uuid references public.interventions (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  purpose text not null check (purpose in ('quote_acceptance', 'repair_pickup', 'general')),
  signature_data text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Helpers RLS portail
create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ca.client_id
  from public.client_accounts ca
  where ca.auth_user_id = auth.uid()
    and ca.enabled = true
  limit 1
$$;

create or replace function public.is_portal_client()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return public.current_client_id() is not null;
end;
$$;

create or replace function public.current_client_workshop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ca.workshop_id
  from public.client_accounts ca
  where ca.auth_user_id = auth.uid()
    and ca.enabled = true
  limit 1
$$;

-- Index
create index if not exists client_accounts_client_idx on public.client_accounts (client_id);
create index if not exists portal_repair_events_intervention_idx on public.portal_repair_events (intervention_id, created_at);
create index if not exists portal_messages_client_idx on public.portal_messages (client_id, created_at desc);
create index if not exists portal_notifications_client_idx on public.portal_notifications (client_id, created_at desc);
create index if not exists portal_quote_validations_quote_idx on public.portal_quote_validations (quote_id);

-- RLS
alter table public.client_accounts enable row level security;
alter table public.portal_repair_events enable row level security;
alter table public.portal_messages enable row level security;
alter table public.portal_notifications enable row level security;
alter table public.portal_quote_validations enable row level security;
alter table public.portal_client_signatures enable row level security;

-- client_accounts
drop policy if exists "client_accounts_self" on public.client_accounts;
create policy "client_accounts_self" on public.client_accounts
  for select using (auth_user_id = auth.uid());

drop policy if exists "client_accounts_workshop" on public.client_accounts;
create policy "client_accounts_workshop" on public.client_accounts
  for all using (
    workshop_id = public.current_workshop_id()
    or public.workshop_row_visible(workshop_id, auth.uid())
  )
  with check (workshop_id = public.current_workshop_id());

-- Lecture métier isolée client (SELECT uniquement)
drop policy if exists "clients_portal_select" on public.clients;
create policy "clients_portal_select" on public.clients
  for select using (id = public.current_client_id());

drop policy if exists "devices_portal_select" on public.devices;
create policy "devices_portal_select" on public.devices
  for select using (client_id = public.current_client_id());

drop policy if exists "interventions_portal_select" on public.interventions;
create policy "interventions_portal_select" on public.interventions
  for select using (client_id = public.current_client_id());

drop policy if exists "quotes_portal_select" on public.quotes;
create policy "quotes_portal_select" on public.quotes
  for select using (client_id = public.current_client_id());

drop policy if exists "invoices_portal_select" on public.invoices;
create policy "invoices_portal_select" on public.invoices
  for select using (client_id = public.current_client_id());

-- Portal tables — client
drop policy if exists "portal_repair_events_client" on public.portal_repair_events;
create policy "portal_repair_events_client" on public.portal_repair_events
  for select using (client_id = public.current_client_id() and is_public = true);

drop policy if exists "portal_messages_client" on public.portal_messages;
create policy "portal_messages_client" on public.portal_messages
  for all using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id() and sender_type = 'client');

drop policy if exists "portal_notifications_client" on public.portal_notifications;
create policy "portal_notifications_client" on public.portal_notifications
  for all using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

drop policy if exists "portal_quote_validations_client" on public.portal_quote_validations;
create policy "portal_quote_validations_client" on public.portal_quote_validations
  for all using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

drop policy if exists "portal_signatures_client" on public.portal_client_signatures;
create policy "portal_signatures_client" on public.portal_client_signatures
  for all using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

-- Portal tables — atelier (staff)
drop policy if exists "portal_repair_events_workshop" on public.portal_repair_events;
create policy "portal_repair_events_workshop" on public.portal_repair_events
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "portal_messages_workshop" on public.portal_messages;
create policy "portal_messages_workshop" on public.portal_messages
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "portal_notifications_workshop_insert" on public.portal_notifications;
create policy "portal_notifications_workshop_insert" on public.portal_notifications
  for insert with check (workshop_id = public.current_workshop_id());

drop policy if exists "portal_notifications_workshop_select" on public.portal_notifications;
create policy "portal_notifications_workshop_select" on public.portal_notifications
  for select using (workshop_id = public.current_workshop_id());

drop policy if exists "portal_quote_validations_workshop" on public.portal_quote_validations;
create policy "portal_quote_validations_workshop" on public.portal_quote_validations
  for select using (workshop_id = public.current_workshop_id());

drop policy if exists "portal_signatures_workshop" on public.portal_client_signatures;
create policy "portal_signatures_workshop" on public.portal_client_signatures
  for select using (workshop_id = public.current_workshop_id());

-- Mise à jour devis limitée client (validation)
drop policy if exists "quotes_portal_update_validation" on public.quotes;
create policy "quotes_portal_update_validation" on public.quotes
  for update using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());
