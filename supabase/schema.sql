-- Schéma Supabase de référence pour AT72Manager
-- Idempotent : peut être exécuté plusieurs fois sans erreur

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text default 'technician',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  status text not null default 'active',
  notes text,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  device_type text,
  brand text,
  model text,
  serial_number text,
  imei text,
  storage_capacity text,
  color text,
  condition text not null default 'good',
  notes text,
  media jsonb default '{}'::jsonb,
  name text,
  status text default 'good',
  location text,
  last_service_at timestamptz,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  device_label text,
  brand text,
  model text,
  imei_or_serial text,
  reported_issue text,
  diagnostic text,
  technician_notes text,
  status text not null default 'diagnostic',
  estimated_price numeric(10, 2),
  final_price numeric(10, 2),
  media jsonb default '{}'::jsonb,
  title text,
  description text,
  priority text default 'medium',
  scheduled_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer not null default 60,
  assigned_technician_id text,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  intervention_id uuid references public.interventions (id) on delete set null,
  device_id uuid references public.devices (id) on delete set null,
  status text not null default 'draft',
  title text,
  notes text,
  lines jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  vat_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  valid_until date,
  converted_invoice_id uuid,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  intervention_id uuid references public.interventions (id) on delete set null,
  device_id uuid references public.devices (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  status text not null default 'draft',
  title text,
  notes text,
  lines jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  vat_total numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  due_date date,
  paid_at timestamptz,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

create table if not exists public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  message text,
  severity text not null default 'info',
  href text,
  entity_type text,
  entity_id uuid,
  dedupe_key text,
  read boolean not null default false,
  archived boolean not null default false,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists activity_feed_user_created_idx
  on public.activity_feed (user_id, created_at desc);

alter table public.interventions add column if not exists parts_lines jsonb default '[]'::jsonb;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.devices enable row level security;
alter table public.interventions enable row level security;
alter table public.quotes enable row level security;
alter table public.invoices enable row level security;
alter table public.spare_parts enable row level security;
alter table public.stock_movements enable row level security;
alter table public.activity_feed enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "clients_all_own" on public.clients;
drop policy if exists "devices_all_own" on public.devices;
drop policy if exists "interventions_all_own" on public.interventions;
drop policy if exists "quotes_all_own" on public.quotes;
drop policy if exists "invoices_all_own" on public.invoices;
drop policy if exists "spare_parts_all_own" on public.spare_parts;
drop policy if exists "stock_movements_all_own" on public.stock_movements;
drop policy if exists "activity_feed_all_own" on public.activity_feed;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "clients_all_own" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "devices_all_own" on public.devices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "interventions_all_own" on public.interventions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quotes_all_own" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invoices_all_own" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spare_parts_all_own" on public.spare_parts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "stock_movements_all_own" on public.stock_movements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity_feed_all_own" on public.activity_feed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
