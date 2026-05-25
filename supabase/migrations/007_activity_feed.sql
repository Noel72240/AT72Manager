-- Migration : fil d'activité & notifications
-- Exécuter dans Supabase → SQL Editor → Run

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

create index if not exists activity_feed_dedupe_idx
  on public.activity_feed (user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.activity_feed enable row level security;

drop policy if exists "activity_feed_all_own" on public.activity_feed;

create policy "activity_feed_all_own" on public.activity_feed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
