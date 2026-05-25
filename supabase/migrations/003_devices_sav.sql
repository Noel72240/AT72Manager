-- Migration SAV : colonnes appareils étendues
-- Exécuter dans Supabase → SQL Editor → Run

alter table public.devices add column if not exists device_type text;
alter table public.devices add column if not exists brand text;
alter table public.devices add column if not exists imei text;
alter table public.devices add column if not exists storage_capacity text;
alter table public.devices add column if not exists color text;
alter table public.devices add column if not exists condition text;
alter table public.devices add column if not exists notes text;
alter table public.devices add column if not exists media jsonb default '{}'::jsonb;

-- Rétro-remplissage depuis l'ancien schéma
update public.devices
set device_type = coalesce(device_type, name)
where device_type is null and name is not null;

update public.devices
set condition = coalesce(condition, status, 'good')
where condition is null;

notify pgrst, 'reload schema';
