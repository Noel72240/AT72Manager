-- Système documents client (devis/facture Qonto, SAV) — table + historique + bucket at72-documents

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.intervention_documents (
  id uuid primary key default gen_random_uuid(),
  intervention_id uuid not null references public.interventions (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  device_id uuid references public.devices (id) on delete set null,
  type text not null check (type in ('quote', 'invoice', 'sav_document', 'attachment')),
  file_name text not null,
  storage_path text not null,
  mime_type text not null default 'application/pdf',
  size bigint not null default 0 check (size >= 0),
  uploaded_by uuid not null references auth.users (id) on delete restrict,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint intervention_documents_storage_path_key unique (storage_path)
);

create index if not exists intervention_documents_intervention_idx
  on public.intervention_documents (intervention_id, created_at desc)
  where deleted_at is null;

create index if not exists intervention_documents_client_idx
  on public.intervention_documents (client_id, created_at desc)
  where deleted_at is null;

create index if not exists intervention_documents_workshop_idx
  on public.intervention_documents (workshop_id, created_at desc)
  where deleted_at is null;

create index if not exists intervention_documents_type_idx
  on public.intervention_documents (type, created_at desc)
  where deleted_at is null;

create table if not exists public.intervention_document_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.intervention_documents (id) on delete set null,
  intervention_id uuid not null references public.interventions (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  workshop_id uuid not null references public.workshops (id) on delete cascade,
  event_type text not null check (
    event_type in ('uploaded', 'deleted', 'downloaded', 'link_copied', 'viewed')
  ),
  actor_type text not null check (actor_type in ('workshop', 'client')),
  actor_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists intervention_document_events_document_idx
  on public.intervention_document_events (document_id, created_at desc);

create index if not exists intervention_document_events_intervention_idx
  on public.intervention_document_events (intervention_id, created_at desc);

create table if not exists public.portal_document_engagement (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.intervention_documents (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  first_viewed_at timestamptz,
  downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, client_id)
);

create index if not exists portal_document_engagement_client_idx
  on public.portal_document_engagement (client_id, updated_at desc);

-- updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists intervention_documents_set_updated_at on public.intervention_documents;
create trigger intervention_documents_set_updated_at
  before update on public.intervention_documents
  for each row execute function public.set_updated_at();

drop trigger if exists portal_document_engagement_set_updated_at on public.portal_document_engagement;
create trigger portal_document_engagement_set_updated_at
  before update on public.portal_document_engagement
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — intervention_documents
-- ---------------------------------------------------------------------------

alter table public.intervention_documents enable row level security;

drop policy if exists "intervention_documents_workshop_select" on public.intervention_documents;
create policy "intervention_documents_workshop_select"
  on public.intervention_documents for select
  to authenticated
  using (public.workshop_row_visible(workshop_id, uploaded_by));

drop policy if exists "intervention_documents_workshop_insert" on public.intervention_documents;
create policy "intervention_documents_workshop_insert"
  on public.intervention_documents for insert
  to authenticated
  with check (
    public.workshop_row_visible(workshop_id, uploaded_by)
    and uploaded_by = auth.uid()
  );

drop policy if exists "intervention_documents_workshop_update" on public.intervention_documents;
create policy "intervention_documents_workshop_update"
  on public.intervention_documents for update
  to authenticated
  using (public.workshop_row_visible(workshop_id, uploaded_by))
  with check (public.workshop_row_visible(workshop_id, uploaded_by));

drop policy if exists "intervention_documents_client_select" on public.intervention_documents;
create policy "intervention_documents_client_select"
  on public.intervention_documents for select
  to authenticated
  using (
    deleted_at is null
    and client_id = public.current_client_id()
  );

-- ---------------------------------------------------------------------------
-- RLS — intervention_document_events
-- ---------------------------------------------------------------------------

alter table public.intervention_document_events enable row level security;

drop policy if exists "intervention_document_events_workshop" on public.intervention_document_events;
create policy "intervention_document_events_workshop"
  on public.intervention_document_events for all
  to authenticated
  using (public.workshop_row_visible(workshop_id, actor_id::uuid))
  with check (public.workshop_row_visible(workshop_id, actor_id::uuid));

drop policy if exists "intervention_document_events_client_insert" on public.intervention_document_events;
create policy "intervention_document_events_client_insert"
  on public.intervention_document_events for insert
  to authenticated
  with check (
    actor_type = 'client'
    and client_id = public.current_client_id()
    and actor_id = auth.uid()::text
  );

drop policy if exists "intervention_document_events_client_select" on public.intervention_document_events;
create policy "intervention_document_events_client_select"
  on public.intervention_document_events for select
  to authenticated
  using (client_id = public.current_client_id());

-- ---------------------------------------------------------------------------
-- RLS — portal_document_engagement
-- ---------------------------------------------------------------------------

alter table public.portal_document_engagement enable row level security;

drop policy if exists "portal_document_engagement_client" on public.portal_document_engagement;
create policy "portal_document_engagement_client"
  on public.portal_document_engagement for all
  to authenticated
  using (client_id = public.current_client_id())
  with check (client_id = public.current_client_id());

drop policy if exists "portal_document_engagement_workshop_select" on public.portal_document_engagement;
create policy "portal_document_engagement_workshop_select"
  on public.portal_document_engagement for select
  to authenticated
  using (
    exists (
      select 1 from public.intervention_documents d
      where d.id = document_id
        and public.workshop_row_visible(d.workshop_id, d.uploaded_by)
    )
  );

-- ---------------------------------------------------------------------------
-- Storage bucket at72-documents
-- Chemin : {workshop_id}/{client_id}/{intervention_id}/{document_id}/{file_name}
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'at72-documents',
  'at72-documents',
  false,
  15728640, -- 15 Mo (config app par défaut)
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "at72_documents_workshop_insert" on storage.objects;
create policy "at72_documents_workshop_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'at72-documents'
    and exists (
      select 1 from public.intervention_documents d
      where d.storage_path = name
        and public.workshop_row_visible(d.workshop_id, d.uploaded_by)
        and d.uploaded_by = auth.uid()
    )
  );

drop policy if exists "at72_documents_workshop_select" on storage.objects;
create policy "at72_documents_workshop_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'at72-documents'
    and exists (
      select 1 from public.intervention_documents d
      where d.storage_path = name
        and public.workshop_row_visible(d.workshop_id, d.uploaded_by)
    )
  );

drop policy if exists "at72_documents_workshop_update" on storage.objects;
create policy "at72_documents_workshop_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'at72-documents'
    and exists (
      select 1 from public.intervention_documents d
      where d.storage_path = name
        and public.workshop_row_visible(d.workshop_id, d.uploaded_by)
    )
  )
  with check (bucket_id = 'at72-documents');

drop policy if exists "at72_documents_workshop_delete" on storage.objects;
create policy "at72_documents_workshop_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'at72-documents'
    and exists (
      select 1 from public.intervention_documents d
      where d.storage_path = name
        and public.workshop_row_visible(d.workshop_id, d.uploaded_by)
    )
  );

drop policy if exists "at72_documents_client_select" on storage.objects;
create policy "at72_documents_client_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'at72-documents'
    and exists (
      select 1 from public.intervention_documents d
      where d.storage_path = name
        and d.deleted_at is null
        and d.client_id = public.current_client_id()
    )
  );

comment on table public.intervention_documents is 'PDF/documents client liés aux interventions (Qonto, SAV)';
comment on table public.intervention_document_events is 'Historique actions documents (upload, download, suppression)';
comment on table public.portal_document_engagement is 'Suivi consultation/téléchargement portail client';
