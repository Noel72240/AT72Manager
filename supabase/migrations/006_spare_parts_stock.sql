-- Migration : pièces détachées & mouvements de stock
-- Exécuter dans Supabase → SQL Editor → Run

create table if not exists public.spare_parts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Autre',
  reference text not null,
  supplier text,
  purchase_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  quantity integer not null default 0,
  min_threshold integer not null default 0,
  notes text,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.spare_parts (id) on delete cascade,
  movement_type text not null,
  delta integer not null,
  quantity_after integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_part_idx on public.stock_movements (part_id, created_at desc);
create unique index if not exists spare_parts_ref_user_idx on public.spare_parts (user_id, reference);

alter table public.interventions add column if not exists parts_lines jsonb default '[]'::jsonb;

alter table public.spare_parts enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "spare_parts_all_own" on public.spare_parts;
drop policy if exists "stock_movements_all_own" on public.stock_movements;

create policy "spare_parts_all_own" on public.spare_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "stock_movements_all_own" on public.stock_movements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
