-- Bucket Storage pour PDF devis/facture Qonto (portail client)
-- Chemin : {client_id}/{intervention_id}/{document_id}.pdf

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'intervention-documents',
  'intervention-documents',
  false,
  10485760, -- 10 Mo
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Atelier : upload si l'intervention appartient au client de l'utilisateur
drop policy if exists "intervention_docs_workshop_insert" on storage.objects;
create policy "intervention_docs_workshop_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'intervention-documents'
    and exists (
      select 1
      from public.interventions i
      join public.clients c on c.id = i.client_id
      where (storage.foldername(name))[1] = i.client_id::text
        and (storage.foldername(name))[2] = i.id::text
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "intervention_docs_workshop_select" on storage.objects;
create policy "intervention_docs_workshop_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'intervention-documents'
    and exists (
      select 1
      from public.interventions i
      join public.clients c on c.id = i.client_id
      where (storage.foldername(name))[1] = i.client_id::text
        and (storage.foldername(name))[2] = i.id::text
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "intervention_docs_workshop_update" on storage.objects;
create policy "intervention_docs_workshop_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'intervention-documents'
    and exists (
      select 1
      from public.interventions i
      join public.clients c on c.id = i.client_id
      where (storage.foldername(name))[1] = i.client_id::text
        and (storage.foldername(name))[2] = i.id::text
        and c.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'intervention-documents'
    and exists (
      select 1
      from public.interventions i
      join public.clients c on c.id = i.client_id
      where (storage.foldername(name))[1] = i.client_id::text
        and (storage.foldername(name))[2] = i.id::text
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "intervention_docs_workshop_delete" on storage.objects;
create policy "intervention_docs_workshop_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'intervention-documents'
    and exists (
      select 1
      from public.interventions i
      join public.clients c on c.id = i.client_id
      where (storage.foldername(name))[1] = i.client_id::text
        and (storage.foldername(name))[2] = i.id::text
        and c.user_id = auth.uid()
    )
  );

-- Portail client : lecture des documents de son dossier client
drop policy if exists "intervention_docs_client_select" on storage.objects;
create policy "intervention_docs_client_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'intervention-documents'
    and (storage.foldername(name))[1] = public.current_client_id()::text
  );
