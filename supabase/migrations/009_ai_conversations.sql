-- Migration : historique conversations assistant IA
-- Exécuter dans Supabase → SQL Editor → Run

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Conversation',
  messages jsonb not null default '[]'::jsonb,
  context_snapshot jsonb,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations (user_id, updated_at desc);

alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_all_own" on public.ai_conversations;

create policy "ai_conversations_all_own" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
