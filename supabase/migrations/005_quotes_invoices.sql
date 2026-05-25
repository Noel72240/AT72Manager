-- Migration : devis et factures SAV
-- Exécuter dans Supabase → SQL Editor → Run

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

create unique index if not exists quotes_number_user_idx on public.quotes (user_id, number);
create unique index if not exists invoices_number_user_idx on public.invoices (user_id, number);

alter table public.quotes enable row level security;
alter table public.invoices enable row level security;

drop policy if exists "quotes_all_own" on public.quotes;
drop policy if exists "invoices_all_own" on public.invoices;

create policy "quotes_all_own" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invoices_all_own" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
