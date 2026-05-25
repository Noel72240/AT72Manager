# Migrations Supabase — ordre d'exécution

## Erreur `relation "public.workshops" does not exist`

Cette erreur survient si **`011_client_portal.sql`** est exécuté **sans** la fondation multi-atelier.

## Ordre obligatoire

| # | Fichier | Rôle |
|---|---------|------|
| 1 | `012_multi_workshop_foundation.sql` | Table `workshops`, relations, backfill, RLS avec fallback |
| 2 | `011_client_portal.sql` | Portail client (référence `workshops`) |

`010_rbac_workshop_audit.sql` est **remplacé / enrichi** par `012` (idempotent). Si `010` n'a jamais été appliqué, exécutez seulement **012 puis 011**.

## Éditeur SQL Supabase

1. Nouvelle requête → coller **tout** `012_multi_workshop_foundation.sql` → **Run**
2. Nouvelle requête → coller **tout** `011_client_portal.sql` → **Run**

## CLI

```bash
supabase db push
```

## Architecture multi-atelier

- **`workshops`** : tenant / atelier (`slug`, `is_default`, `plan_tier`, `settings`)
- **`workshop_members`** : utilisateurs ↔ ateliers
- **`profiles.workshop_id`** : atelier actif du collaborateur
- **`clients` / `interventions` / `quotes` / `invoices` …** : `workshop_id` pour isolation

### Fallback (données anciennes)

- `current_workshop_id()` : profil → membre → owner → atelier par défaut
- `workshop_row_visible(workshop_id, user_id)` : filtre atelier **ou** `user_id = auth.uid()` si pas d'atelier
- Atelier par défaut UUID fixe si base vide : `00000000-0000-4000-8000-000000000001`

### Vérification

```sql
select count(*) as workshops from public.workshops;
select count(*) as clients_sans_atelier from public.clients where workshop_id is null;
```

Les deux compteurs doivent être cohérents (`clients_sans_atelier` = 0 après migration).
