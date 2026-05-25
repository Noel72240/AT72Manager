-- Migration : champs planning calendrier interventions
-- Exécuter dans Supabase → SQL Editor → Run

alter table public.interventions
  add column if not exists duration_minutes integer not null default 60;

alter table public.interventions
  add column if not exists assigned_technician_id text;

create index if not exists interventions_scheduled_at_idx
  on public.interventions (user_id, scheduled_at desc nulls last);

notify pgrst, 'reload schema';
