-- ═══════════════════════════════════════════════════════════════════════════════
-- CORRECTIF RAPIDE — colonnes workshop_id manquantes + liaison des données
-- À exécuter dans Supabase SQL Editor si vous avez l'erreur :
--   column q.workshop_id does not exist
-- Idempotent (peut être relancé sans danger)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── A. Table workshops (si absente) ───────────────────────────────────────────
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

alter table public.workshops add column if not exists slug text;
alter table public.workshops add column if not exists is_default boolean not null default false;
alter table public.workshops add column if not exists plan_tier text not null default 'standard';
alter table public.workshops add column if not exists settings jsonb not null default '{}'::jsonb;

-- Atelier par défaut si la table est vide
insert into public.workshops (id, name, slug, is_default)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Mon atelier AT72Manager',
  'mon-atelier',
  true
where not exists (select 1 from public.workshops)
on conflict (id) do nothing;

-- ─── B. Colonne workshop_id partout où il manque ─────────────────────────────
alter table public.profiles add column if not exists workshop_id uuid references public.workshops (id) on delete set null;

alter table public.clients add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.devices add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.interventions add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.quotes add column if not exists workshop_id uuid references public.workshops (id) on delete set null;
alter table public.invoices add column if not exists workshop_id uuid references public.workshops (id) on delete set null;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'spare_parts') then
    execute 'alter table public.spare_parts add column if not exists workshop_id uuid references public.workshops (id) on delete set null';
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_feed') then
    execute 'alter table public.activity_feed add column if not exists workshop_id uuid references public.workshops (id) on delete set null';
  end if;
end $$;

-- Portail client (colonnes sur clients)
alter table public.clients add column if not exists portal_enabled boolean not null default false;
alter table public.clients add column if not exists portal_access_code text;

-- ─── C. Créer un atelier par utilisateur (profil) ─────────────────────────────
insert into public.workshops (id, name, owner_id, is_default)
select
  p.id,
  coalesce(nullif(trim(p.full_name), ''), 'Mon atelier'),
  p.id,
  true
from public.profiles p
where not exists (select 1 from public.workshops w where w.id = p.id)
on conflict (id) do nothing;

-- Profil → son atelier (même id qu’avant dans l’app)
update public.profiles p
set workshop_id = coalesce(p.workshop_id, p.id)
where p.workshop_id is null
  and exists (select 1 from public.workshops w where w.id = p.id);

-- Sinon → premier atelier disponible
update public.profiles p
set workshop_id = (select id from public.workshops order by is_default desc, created_at asc limit 1)
where p.workshop_id is null;

-- ─── D. Lier clients, devis, factures, etc. à l’atelier ───────────────────────
update public.clients c
set workshop_id = coalesce(c.workshop_id, p.workshop_id, c.user_id)
from public.profiles p
where c.user_id = p.id and c.workshop_id is null;

update public.devices d
set workshop_id = coalesce(d.workshop_id, p.workshop_id)
from public.profiles p
where d.user_id = p.id and d.workshop_id is null;

update public.interventions i
set workshop_id = coalesce(i.workshop_id, p.workshop_id, i.user_id)
from public.profiles p
where i.user_id = p.id and i.workshop_id is null;

update public.quotes q
set workshop_id = coalesce(q.workshop_id, p.workshop_id, q.user_id)
from public.profiles p
where q.user_id = p.id and q.workshop_id is null;

update public.invoices inv
set workshop_id = coalesce(inv.workshop_id, p.workshop_id, inv.user_id)
from public.profiles p
where inv.user_id = p.id and inv.workshop_id is null;

-- ─── E. Vérification (lisez le résultat) ───────────────────────────────────────
select 'workshops' as table_name, count(*)::text as total from public.workshops
union all
select 'profiles sans atelier', count(*)::text from public.profiles where workshop_id is null
union all
select 'quotes sans atelier', count(*)::text from public.quotes where workshop_id is null
union all
select 'invoices sans atelier', count(*)::text from public.invoices where workshop_id is null;
