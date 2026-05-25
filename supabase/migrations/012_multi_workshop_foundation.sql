-- ═══════════════════════════════════════════════════════════════════════════════
-- AT72Manager — Fondation multi-atelier (SaaS-ready)
-- Idempotent · compatible données existantes · exécutable seul ou avant 011
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Table workshops ───────────────────────────────────────────────────────
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

create unique index if not exists workshops_slug_unique_idx
  on public.workshops (slug)
  where slug is not null;

create index if not exists workshops_owner_idx on public.workshops (owner_id);
create index if not exists workshops_default_idx on public.workshops (is_default) where is_default = true;

-- Colonnes SaaS (ajout sans casser l'existant)
alter table public.workshops add column if not exists slug text;
alter table public.workshops add column if not exists is_default boolean not null default false;
alter table public.workshops add column if not exists plan_tier text not null default 'standard';
alter table public.workshops add column if not exists settings jsonb not null default '{}'::jsonb;

-- ─── 2. Profils & membres ─────────────────────────────────────────────────────
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

create index if not exists workshop_members_user_idx on public.workshop_members (user_id);
create index if not exists workshop_members_workshop_idx on public.workshop_members (workshop_id);

-- ─── 3. Audit & sessions (dépendent de workshops) ───────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid references public.workshops (id) on delete cascade,
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

-- Rendre workshop_id nullable sur audit si créé avant cette migration
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'audit_logs' and column_name = 'workshop_id'
  ) then
    alter table public.audit_logs alter column workshop_id drop not null;
  end if;
end $$;

-- ─── 4. Relations workshop_id sur entités métier ──────────────────────────────
alter table public.clients add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.devices add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.interventions add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.quotes add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.invoices add column if not exists workshop_id uuid references public.workshops (id) on delete set null;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'spare_parts') then
    alter table public.spare_parts add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'stock_movements') then
    alter table public.stock_movements add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_feed') then
    alter table public.activity_feed add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
  end if;
end $$;

create index if not exists clients_workshop_idx on public.clients (workshop_id);
create index if not exists devices_workshop_idx on public.devices (workshop_id);
create index if not exists interventions_workshop_idx on public.interventions (workshop_id);
create index if not exists quotes_workshop_idx on public.quotes (workshop_id);
create index if not exists invoices_workshop_idx on public.invoices (workshop_id);

-- ─── 5. Migration données : ateliers par profil (legacy 1 user = 1 atelier) ───
insert into public.workshops (id, name, slug, owner_id, is_default)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), 'Mon atelier'),
  'atelier-' || left(replace(p.id::text, '-', ''), 12),
  p.id,
  true
from public.profiles p
where not exists (select 1 from public.workshops w where w.id = p.id)
on conflict (id) do update set
  name = excluded.name,
  owner_id = coalesce(public.workshops.owner_id, excluded.owner_id),
  updated_at = now();

-- Utilisateurs avec données mais sans profil : atelier dérivé de user_id
insert into public.workshops (id, name, slug, owner_id, is_default)
select distinct
  c.user_id,
  'Atelier principal',
  'atelier-' || left(replace(c.user_id::text, '-', ''), 12),
  c.user_id,
  true
from public.clients c
where c.user_id is not null
  and not exists (select 1 from public.workshops w where w.id = c.user_id or w.owner_id = c.user_id)
on conflict (id) do nothing;

-- Atelier global par défaut si base vide (premier déploiement)
insert into public.workshops (id, name, slug, is_default, plan_tier)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  'AT72Manager — Atelier principal',
  'atelier-principal',
  true,
  'standard'
where not exists (select 1 from public.workshops)
on conflict (id) do nothing;

-- Lier profils → atelier
update public.profiles p
set workshop_id = coalesce(p.workshop_id, p.id)
where p.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = p.id);

update public.profiles p
set workshop_id = w.id
from public.workshops w
where p.workshop_id is null
  and w.owner_id = p.id;

-- Fallback profil → atelier par défaut
update public.profiles p
set workshop_id = (
  select w.id from public.workshops w
  order by w.is_default desc, w.created_at asc
  limit 1
)
where p.workshop_id is null;

-- Backfill entités métier via profil propriétaire
update public.clients c
set workshop_id = coalesce(c.workshop_id, p.workshop_id)
from public.profiles p
where c.user_id = p.id and c.workshop_id is null and p.workshop_id is not null;

update public.devices d
set workshop_id = coalesce(d.workshop_id, p.workshop_id)
from public.profiles p
where d.user_id = p.id and d.workshop_id is null and p.workshop_id is not null;

update public.interventions i
set workshop_id = coalesce(i.workshop_id, p.workshop_id)
from public.profiles p
where i.user_id = p.id and i.workshop_id is null and p.workshop_id is not null;

update public.quotes q
set workshop_id = coalesce(q.workshop_id, p.workshop_id)
from public.profiles p
where q.user_id = p.id and q.workshop_id is null and p.workshop_id is not null;

update public.invoices inv
set workshop_id = coalesce(inv.workshop_id, p.workshop_id)
from public.profiles p
where inv.user_id = p.id and inv.workshop_id is null and p.workshop_id is not null;

-- Fallback legacy : user_id seul (sans workshop_id profil)
update public.clients c
set workshop_id = coalesce(c.workshop_id, c.user_id)
where c.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = c.user_id);

update public.interventions i
set workshop_id = coalesce(i.workshop_id, i.user_id)
where i.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = i.user_id);

update public.quotes q
set workshop_id = coalesce(q.workshop_id, q.user_id)
where q.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = q.user_id);

update public.invoices inv
set workshop_id = coalesce(inv.workshop_id, inv.user_id)
where inv.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = inv.user_id);

-- Dernier recours : atelier par défaut
do $$
declare
  default_wid uuid;
begin
  select id into default_wid from public.workshops order by is_default desc, created_at asc limit 1;
  if default_wid is null then
    return;
  end if;

  update public.clients set workshop_id = default_wid where workshop_id is null;
  update public.devices set workshop_id = default_wid where workshop_id is null;
  update public.interventions set workshop_id = default_wid where workshop_id is null;
  update public.quotes set workshop_id = default_wid where workshop_id is null;
  update public.invoices set workshop_id = default_wid where workshop_id is null;
end $$;

-- Membres atelier
insert into public.workshop_members (workshop_id, user_id, role)
select p.workshop_id, p.id, coalesce(nullif(p.role, ''), 'technician')
from public.profiles p
where p.workshop_id is not null
on conflict (workshop_id, user_id) do update set role = excluded.role;

-- ─── 6. Fonctions RLS avec fallback legacy ────────────────────────────────────
create or replace function public.default_workshop_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.workshops
  order by is_default desc, created_at asc
  limit 1
$$;

create or replace function public.current_workshop_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  wid uuid;
begin
  if auth.uid() is null then
    return public.default_workshop_id();
  end if;

  select workshop_id into wid from public.profiles where id = auth.uid();
  if wid is not null then
    return wid;
  end if;

  select wm.workshop_id into wid
  from public.workshop_members wm
  where wm.user_id = auth.uid()
  order by wm.joined_at asc
  limit 1;
  if wid is not null then
    return wid;
  end if;

  select w.id into wid
  from public.workshops w
  where w.owner_id = auth.uid() or w.id = auth.uid()
  order by w.is_default desc
  limit 1;
  if wid is not null then
    return wid;
  end if;

  return public.default_workshop_id();
end;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    (select role from public.workshop_members where user_id = auth.uid() limit 1),
    'technician'
  )
$$;

create or replace function public.is_workshop_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('admin', 'manager')
$$;

/** Accès ligne : atelier courant OU mode legacy user_id si pas d'atelier résolu */
create or replace function public.workshop_row_visible(p_workshop_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when public.is_portal_client() then false
      when public.current_workshop_id() is not null then p_workshop_id = public.current_workshop_id()
      else p_user_id = auth.uid()
    end
$$;

create or replace function public.workshop_row_writable(p_workshop_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.workshop_row_visible(p_workshop_id, p_user_id)
$$;

-- Portail client (safe si table client_accounts absente)
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
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'client_accounts'
  ) then
    return false;
  end if;
  return exists (
    select 1 from public.client_accounts ca
    where ca.auth_user_id = auth.uid() and ca.enabled = true
  );
end;
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
    new.workshop_id := public.current_workshop_id();
  end if;
  if new.workshop_id is null then
    new.workshop_id := public.default_workshop_id();
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
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      execute format('drop trigger if exists set_workshop_id_%I on public.%I', tbl, tbl);
      execute format(
        'create trigger set_workshop_id_%I before insert on public.%I for each row execute function public.set_workshop_id_from_profile()',
        tbl, tbl
      );
    end if;
  end loop;
end $$;

-- ─── 7. Fonction d'entrée unique (appelée aussi par 011) ──────────────────────
create or replace function public.ensure_workshop_foundation()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No-op : ce fichier applique déjà la fondation ; la fonction existe pour
  -- SELECT public.ensure_workshop_foundation(); dans l'éditeur SQL avant 011.
  null;
end;
$$;

-- ─── 8. RLS workshops & policies métier ───────────────────────────────────────
alter table public.workshops enable row level security;
alter table public.workshop_members enable row level security;

drop policy if exists "workshops_member_select" on public.workshops;
create policy "workshops_member_select" on public.workshops
  for select using (
    id = public.current_workshop_id()
    or owner_id = auth.uid()
    or exists (
      select 1 from public.workshop_members wm
      where wm.workshop_id = workshops.id and wm.user_id = auth.uid()
    )
  );

drop policy if exists "workshop_members_select" on public.workshop_members;
create policy "workshop_members_select" on public.workshop_members
  for select using (workshop_id = public.current_workshop_id() or user_id = auth.uid());

drop policy if exists "workshop_members_admin_manage" on public.workshop_members;
create policy "workshop_members_admin_manage" on public.workshop_members
  for all using (public.is_workshop_admin() and workshop_id = public.current_workshop_id())
  with check (public.is_workshop_admin() and workshop_id = public.current_workshop_id());

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_workshop_select" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

create policy "profiles_workshop_select" on public.profiles
  for select using (
    id = auth.uid()
    or workshop_id = public.current_workshop_id()
    or public.workshop_row_visible(workshop_id, id)
  );

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_admin_update" on public.profiles
  for update using (public.is_workshop_admin() and workshop_id = public.current_workshop_id())
  with check (public.is_workshop_admin() and workshop_id = public.current_workshop_id());

-- Entités métier
drop policy if exists "clients_all_own" on public.clients;
drop policy if exists "clients_workshop" on public.clients;
create policy "clients_workshop" on public.clients
  for all using (public.workshop_row_visible(workshop_id, user_id))
  with check (public.workshop_row_writable(workshop_id, user_id));

drop policy if exists "devices_all_own" on public.devices;
drop policy if exists "devices_workshop" on public.devices;
create policy "devices_workshop" on public.devices
  for all using (public.workshop_row_visible(workshop_id, user_id))
  with check (public.workshop_row_writable(workshop_id, user_id));

drop policy if exists "interventions_all_own" on public.interventions;
drop policy if exists "interventions_workshop" on public.interventions;
create policy "interventions_workshop" on public.interventions
  for all using (public.workshop_row_visible(workshop_id, user_id))
  with check (public.workshop_row_writable(workshop_id, user_id));

drop policy if exists "quotes_all_own" on public.quotes;
drop policy if exists "quotes_workshop" on public.quotes;
create policy "quotes_workshop" on public.quotes
  for all using (public.workshop_row_visible(workshop_id, user_id))
  with check (public.workshop_row_writable(workshop_id, user_id));

drop policy if exists "invoices_all_own" on public.invoices;
drop policy if exists "invoices_workshop" on public.invoices;
create policy "invoices_workshop" on public.invoices
  for all using (public.workshop_row_visible(workshop_id, user_id))
  with check (public.workshop_row_writable(workshop_id, user_id));

-- Tables optionnelles
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'spare_parts') then
    alter table public.spare_parts enable row level security;
    execute 'drop policy if exists "spare_parts_all_own" on public.spare_parts';
    execute 'drop policy if exists "spare_parts_workshop" on public.spare_parts';
    execute $p$
      create policy "spare_parts_workshop" on public.spare_parts
        for all using (public.workshop_row_visible(workshop_id, user_id))
        with check (public.workshop_row_writable(workshop_id, user_id))
    $p$;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'stock_movements') then
    alter table public.stock_movements enable row level security;
    execute 'drop policy if exists "stock_movements_all_own" on public.stock_movements';
    execute 'drop policy if exists "stock_movements_workshop" on public.stock_movements';
    execute $p$
      create policy "stock_movements_workshop" on public.stock_movements
        for all using (public.workshop_row_visible(workshop_id, user_id))
        with check (public.workshop_row_writable(workshop_id, user_id))
    $p$;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_feed') then
    alter table public.activity_feed enable row level security;
    execute 'drop policy if exists "activity_feed_all_own" on public.activity_feed';
    execute 'drop policy if exists "activity_feed_workshop" on public.activity_feed';
    execute $p$
      create policy "activity_feed_workshop" on public.activity_feed
        for all using (public.workshop_row_visible(workshop_id, user_id))
        with check (public.workshop_row_writable(workshop_id, user_id))
    $p$;
  end if;
end $$;

-- Audit (si tables présentes)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audit_logs') then
    alter table public.audit_logs enable row level security;
    execute 'drop policy if exists "audit_logs_workshop" on public.audit_logs';
    execute $p$
      create policy "audit_logs_workshop" on public.audit_logs
        for all using (
          workshop_id is null
          or workshop_id = public.current_workshop_id()
          or public.workshop_row_visible(workshop_id, actor_id)
        )
        with check (
          workshop_id is null
          or workshop_id = public.current_workshop_id()
        )
    $p$;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'security_logs') then
    alter table public.security_logs enable row level security;
    execute 'drop policy if exists "security_logs_workshop" on public.security_logs';
    execute $p$
      create policy "security_logs_workshop" on public.security_logs
        for all using (
          user_id = auth.uid()
          or workshop_id = public.current_workshop_id()
          or workshop_id is null
        )
        with check (
          user_id = auth.uid()
          or workshop_id = public.current_workshop_id()
        )
    $p$;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_sessions') then
    alter table public.user_sessions enable row level security;
    execute 'drop policy if exists "user_sessions_own" on public.user_sessions';
    execute $p$
      create policy "user_sessions_own" on public.user_sessions
        for all using (
          user_id = auth.uid()
          or (public.is_workshop_admin() and workshop_id = public.current_workshop_id())
        )
        with check (user_id = auth.uid())
    $p$;
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'audit_logs') then
    create index if not exists audit_logs_workshop_created_idx on public.audit_logs (workshop_id, created_at desc);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'security_logs') then
    create index if not exists security_logs_workshop_created_idx on public.security_logs (workshop_id, created_at desc);
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'user_sessions') then
    create index if not exists user_sessions_user_active_idx on public.user_sessions (user_id, is_active);
  end if;
end $$;

comment on table public.workshops is 'Tenant / atelier — base multi-atelier SaaS AT72Manager';
comment on function public.current_workshop_id() is 'Atelier actif avec fallback membre, owner, défaut';
comment on function public.workshop_row_visible(uuid, uuid) is 'RLS: atelier ou legacy user_id';
