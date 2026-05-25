-- Migration SAV complète (interventions + appareils)
-- Exécuter une seule fois dans Supabase → SQL Editor → Run

-- === INTERVENTIONS ===
alter table public.interventions add column if not exists device_label text;
alter table public.interventions add column if not exists brand text;
alter table public.interventions add column if not exists model text;
alter table public.interventions add column if not exists imei_or_serial text;
alter table public.interventions add column if not exists reported_issue text;
alter table public.interventions add column if not exists diagnostic text;
alter table public.interventions add column if not exists technician_notes text;
alter table public.interventions add column if not exists estimated_price numeric(10, 2);
alter table public.interventions add column if not exists final_price numeric(10, 2);
alter table public.interventions add column if not exists media jsonb default '{}'::jsonb;

update public.interventions
set reported_issue = coalesce(reported_issue, title)
where reported_issue is null and title is not null;

update public.interventions
set technician_notes = coalesce(technician_notes, description)
where technician_notes is null and description is not null;

update public.interventions
set status = case
  when status = 'scheduled' then 'diagnostic'
  when status = 'cancelled' then 'returned'
  else status
end
where status in ('scheduled', 'cancelled');

-- === APPAREILS ===
alter table public.devices add column if not exists device_type text;
alter table public.devices add column if not exists brand text;
alter table public.devices add column if not exists imei text;
alter table public.devices add column if not exists storage_capacity text;
alter table public.devices add column if not exists color text;
alter table public.devices add column if not exists condition text;
alter table public.devices add column if not exists notes text;
alter table public.devices add column if not exists media jsonb default '{}'::jsonb;

update public.devices
set device_type = coalesce(device_type, name)
where device_type is null and name is not null;

update public.devices
set condition = coalesce(condition, status, 'good')
where condition is null;

-- === DEVIS & FACTURES ===
-- Voir aussi supabase/migrations/005_quotes_invoices.sql (tables complètes)

notify pgrst, 'reload schema';
