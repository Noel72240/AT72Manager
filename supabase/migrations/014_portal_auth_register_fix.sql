-- Correctif inscription / connexion portail client
-- Problème : client_accounts non créé (RLS) ou code atelier illisible sans session

-- Lookup code atelier (sans exposer tous les clients)
create or replace function public.lookup_client_by_portal_code(p_code text)
returns table (client_id uuid, workshop_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.workshop_id
  from public.clients c
  where c.portal_enabled = true
    and c.portal_access_code is not null
    and upper(trim(c.portal_access_code)) = upper(trim(p_code))
  limit 1;
$$;

-- Lier compte Auth ↔ fiche client (après signUp, même sans email confirmé)
create or replace function public.link_portal_client_account(
  p_user_id uuid,
  p_client_id uuid,
  p_workshop_id uuid,
  p_access_code text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  select exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.workshop_id = p_workshop_id
      and c.portal_enabled = true
      and upper(trim(c.portal_access_code)) = upper(trim(p_access_code))
  ) into ok;

  if not ok then
    return false;
  end if;

  insert into public.client_accounts (auth_user_id, client_id, workshop_id, enabled)
  values (p_user_id, p_client_id, p_workshop_id, true)
  on conflict (client_id) do update
    set auth_user_id = excluded.auth_user_id,
        workshop_id = excluded.workshop_id,
        enabled = true,
        updated_at = now();

  return true;
end;
$$;

grant execute on function public.lookup_client_by_portal_code(text) to anon, authenticated;
grant execute on function public.link_portal_client_account(uuid, uuid, uuid, text) to anon, authenticated;

-- Le client peut lire sa propre liaison
drop policy if exists "client_accounts_self_insert" on public.client_accounts;
create policy "client_accounts_self_insert" on public.client_accounts
  for insert
  to authenticated
  with check (auth_user_id = auth.uid());

drop policy if exists "client_accounts_self_update" on public.client_accounts;
create policy "client_accounts_self_update" on public.client_accounts
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());
