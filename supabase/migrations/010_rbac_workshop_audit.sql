-- RBAC, atelier collaboratif, audit & sessions — AT72Manager
-- Idempotent

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles add column if not exists last_seen_at timestamptz;

create table if not exists public.workshop_members (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'technician',
  joined_at timestamptz not null default now(),
  invited_by uuid references auth.users (id),
  unique (workshop_id, user_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  actor_name text,
  action text not null,
  resource text not null,
  resource_id text,
  summary text not null,
  metadata jsonb default '{}'::jsonb,
  device_label text,
  created_at timestamptz not null default now()
);

create table if not exists public.security_logs (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  message text not null,
  device_label text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workshop_id uuid references public.workshops (id) on delete cascade,
  device_label text not null,
  device_fingerprint text,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  ended_at timestamptz,
  is_active boolean not null default true
);

-- workshop_id sur entités métier (partage atelier)
alter table public.clients add column if not exists workshop_id uuid references public.workshops (id);
alter table public.devices add column if not exists workshop_id uuid references public.workshops (id);
alter table public.interventions add column if not exists workshop_id uuid references public.workshops (id);
alter table public.quotes add column if not exists workshop_id uuid references public.workshops (id);
alter table public.invoices add column if not exists workshop_id uuid references public.workshops (id);
alter table public.spare_parts add column if not exists workshop_id uuid references public.workshops (id);
alter table public.stock_movements add column if not exists workshop_id uuid references public.workshops (id);
alter table public.activity_feed add column if not exists workshop_id uuid references public.workshops (id);

-- Backfill ateliers pour profils existants
insert into public.workshops (id, name, owner_id)
select p.id, coalesce(p.full_name, 'Mon atelier'), p.id
from public.profiles p
where p.workshop_id is null
on conflict (id) do nothing;

update public.profiles p
set workshop_id = p.id
where p.workshop_id is null;

update public.clients c
set workshop_id = p.workshop_id
from public.profiles p
where c.user_id = p.id and c.workshop_id is null;

update public.devices d
set workshop_id = p.workshop_id
from public.profiles p
where d.user_id = p.id and d.workshop_id is null;

update public.interventions i
set workshop_id = p.workshop_id
from public.profiles p
where i.user_id = p.id and i.workshop_id is null;

update public.quotes q
set workshop_id = p.workshop_id
from public.profiles p
where q.user_id = p.id and q.workshop_id is null;

update public.invoices inv
set workshop_id = p.workshop_id
from public.profiles p
where inv.user_id = p.id and inv.workshop_id is null;

update public.spare_parts sp
set workshop_id = p.workshop_id
from public.profiles p
where sp.user_id = p.id and sp.workshop_id is null;

update public.stock_movements sm
set workshop_id = p.workshop_id
from public.profiles p
where sm.user_id = p.id and sm.workshop_id is null;

update public.activity_feed af
set workshop_id = p.workshop_id
from public.profiles p
where af.user_id = p.id and af.workshop_id is null;

insert into public.workshop_members (workshop_id, user_id, role)
select p.workshop_id, p.id, coalesce(p.role, 'technician')
from public.profiles p
where p.workshop_id is not null
on conflict (workshop_id, user_id) do nothing;

-- Fonctions RLS
create or replace function public.current_workshop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workshop_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(role, 'technician') from public.profiles where id = auth.uid()
$$;

create or replace function public.is_workshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

-- Trigger auto workshop_id à l'insert
create or replace function public.set_workshop_id_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.workshop_id is null then
    new.workshop_id := (select workshop_id from public.profiles where id = auth.uid());
  end if;
  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['clients','devices','interventions','quotes','invoices','spare_parts','stock_movements','activity_feed']
  loop
    execute format('drop trigger if exists set_workshop_id_%I on public.%I', tbl, tbl);
    execute format(
      'create trigger set_workshop_id_%I before insert on public.%I for each row execute function public.set_workshop_id_from_profile()',
      tbl, tbl
    );
  end loop;
end $$;

-- RLS workshops & membres
alter table public.workshops enable row level security;
alter table public.workshop_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.security_logs enable row level security;
alter table public.user_sessions enable row level security;

drop policy if exists "workshops_member_select" on public.workshops;
create policy "workshops_member_select" on public.workshops
  for select using (id = public.current_workshop_id());

drop policy if exists "workshop_members_select" on public.workshop_members;
create policy "workshop_members_select" on public.workshop_members
  for select using (workshop_id = public.current_workshop_id());

drop policy if exists "workshop_members_admin_manage" on public.workshop_members;
create policy "workshop_members_admin_manage" on public.workshop_members
  for all using (public.is_workshop_admin() and workshop_id = public.current_workshop_id())
  with check (public.is_workshop_admin() and workshop_id = public.current_workshop_id());

-- Profiles étendus
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_workshop_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_workshop_select" on public.profiles
  for select using (workshop_id = public.current_workshop_id() or id = auth.uid());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_workshop_admin() and workshop_id = public.current_workshop_id())
  with check (public.is_workshop_admin() and workshop_id = public.current_workshop_id());

-- Données métier : accès atelier (lecture) + écriture selon rôle implicite via app + ownership
drop policy if exists "clients_all_own" on public.clients;
create policy "clients_workshop" on public.clients
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "devices_all_own" on public.devices;
create policy "devices_workshop" on public.devices
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "interventions_all_own" on public.interventions;
create policy "interventions_workshop" on public.interventions
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "quotes_all_own" on public.quotes;
create policy "quotes_workshop" on public.quotes
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "invoices_all_own" on public.invoices;
create policy "invoices_workshop" on public.invoices
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "spare_parts_all_own" on public.spare_parts;
create policy "spare_parts_workshop" on public.spare_parts
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "stock_movements_all_own" on public.stock_movements;
create policy "stock_movements_workshop" on public.stock_movements
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "activity_feed_all_own" on public.activity_feed;
create policy "activity_feed_workshop" on public.activity_feed
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

-- Audit & sécurité
drop policy if exists "audit_logs_workshop" on public.audit_logs;
create policy "audit_logs_workshop" on public.audit_logs
  for all using (workshop_id = public.current_workshop_id())
  with check (workshop_id = public.current_workshop_id());

drop policy if exists "security_logs_workshop" on public.security_logs;
create policy "security_logs_workshop" on public.security_logs
  for all using (workshop_id = public.current_workshop_id() or user_id = auth.uid())
  with check (workshop_id = public.current_workshop_id() or user_id = auth.uid());

drop policy if exists "user_sessions_own" on public.user_sessions;
create policy "user_sessions_own" on public.user_sessions
  for all using (user_id = auth.uid() or (public.is_workshop_admin() and workshop_id = public.current_workshop_id()))
  with check (user_id = auth.uid());

create index if not exists audit_logs_workshop_created_idx on public.audit_logs (workshop_id, created_at desc);
create index if not exists security_logs_workshop_created_idx on public.security_logs (workshop_id, created_at desc);
create index if not exists user_sessions_user_active_idx on public.user_sessions (user_id, is_active);
