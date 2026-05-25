-- Migration SAV : colonnes interventions étendues
-- Exécuter dans Supabase → SQL Editor → Run

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

-- Rétro-remplissage depuis l'ancien schéma
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

-- Rafraîchir le cache schéma PostgREST (évite l'erreur "schema cache")
notify pgrst, 'reload schema';
alter table public.interventions add column if not exists brand text;
alter table public.interventions add column if not exists model text;
alter table public.interventions add column if not exists imei_or_serial text;
alter table public.interventions add column if not exists reported_issue text;
alter table public.interventions add column if not exists diagnostic text;
alter table public.interventions add column if not exists technician_notes text;
alter table public.interventions add column if not exists estimated_price numeric(10, 2);
alter table public.interventions add column if not exists final_price numeric(10, 2);
alter table public.interventions add column if not exists media jsonb default '{}'::jsonb;

-- Rétro-remplissage depuis l'ancien schéma
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
