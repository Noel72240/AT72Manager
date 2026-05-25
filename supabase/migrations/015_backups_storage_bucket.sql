-- Bucket Storage pour sauvegardes AT72Manager (export ZIP cloud)
-- Chemin des fichiers : {user_id}/{timestamp}.zip
-- À exécuter dans Supabase : SQL Editor → Run, ou supabase db push

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'backups',
  'backups',
  false,
  104857600, -- 100 Mo
  array['application/zip', 'application/json', 'application/octet-stream']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Chaque utilisateur connecté ne voit que son dossier (premier segment = auth.uid())
drop policy if exists "backups_insert_own" on storage.objects;
create policy "backups_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'backups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backups_select_own" on storage.objects;
create policy "backups_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'backups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backups_update_own" on storage.objects;
create policy "backups_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'backups'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'backups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "backups_delete_own" on storage.objects;
create policy "backups_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'backups'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
