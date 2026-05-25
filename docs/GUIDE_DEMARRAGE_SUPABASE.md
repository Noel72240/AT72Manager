# Guide simple — Supabase et AT72Manager

## En une phrase

Votre base Supabase doit avoir une table **`workshops`** (ateliers) et une colonne **`workshop_id`** sur les devis, factures, clients, etc. Sans ça, la **sync** et le **portail client** ne peuvent pas fonctionner.

---

## Pourquoi vous avez l’erreur `column q.workshop_id does not exist`

Vous avez exécuté un script qui dit :

```sql
UPDATE quotes SET workshop_id = ...
```

Mais la colonne **`workshop_id` n’existe pas encore** sur la table `quotes`.  
C’est comme vouloir remplir un tiroir qui n’a pas encore été installé dans l’armoire.

**Ce n’est pas un bug de l’app** : la migration qui **ajoute** les colonnes n’a pas été appliquée (ou pas jusqu’au bout).

---

## Ce qu’il faut faire (dans l’ordre)

### Étape 1 — Un seul script « correctif »

Dans **Supabase → SQL Editor → New query** :

1. Ouvrez le fichier du projet :  
   `supabase/migrations/013_fix_workshop_columns_backfill.sql`
2. Copiez **tout** le contenu
3. Collez dans l’éditeur
4. Cliquez **Run**

À la fin, vous devez voir un petit tableau avec par exemple :

| table_name | total |
|------------|-------|
| workshops | 1 ou plus |
| profiles sans atelier | **0** |
| quotes sans atelier | **0** |
| invoices sans atelier | **0** |

Si « sans atelier » n’est pas 0, relancez le script ou contactez le support.

### Étape 1b — Connexion portail client (inscription)

Exécutez aussi : **`014_portal_auth_register_fix.sql`**  
(sinon l’inscription crée le login Supabase mais **pas** le lien « client portail » → connexion impossible).

Dans Supabase : **Authentication → Providers → Email** → pour les tests, vous pouvez **désactiver « Confirm email »** (sinon il faut cliquer le lien dans le mail avant de se connecter).

### Étape 2 — Portail client (si pas déjà fait)

Exécutez ensuite **dans un autre onglet SQL** :

1. `012_multi_workshop_foundation.sql` (si pas déjà OK)
2. `011_client_portal.sql`

Ou seulement `011` si `012` a déjà réussi.

### Étape 3 — Dans l’application

1. Redémarrez : `npm run dev`
2. Connectez-vous **atelier** (`/#/login`)
3. Tableau de bord → **Purger échecs** → **Synchroniser**

---

## Schéma mental (simple)

```
┌─────────────┐
│  workshops  │  ← votre atelier (1 ou plusieurs plus tard)
└──────┬──────┘
       │ workshop_id
       ├─ profiles (vous, techniciens)
       ├─ clients
       ├─ interventions
       ├─ quotes (devis)     ← c’est ici que la colonne manquait
       └─ invoices (factures)
```

**Portail client** : le client se connecte avec un code → il ne voit que **ses** lignes (même `client_id`).

---

## Tester le portail client (rappel)

| Qui | Où |
|-----|-----|
| Vous (atelier) | `http://localhost:5173/#/login` → Clients → Activer portail → code |
| Client | `http://localhost:5173/#/portal/register` → code + email + mot de passe |

---

## Ordre des fichiers SQL (référence)

| Fichier | Rôle |
|---------|------|
| `013_fix_workshop_columns_backfill.sql` | **À lancer en premier si erreur colonne manquante** |
| `012_multi_workshop_foundation.sql` | Multi-atelier complet + RLS |
| `011_client_portal.sql` | Portail client |

Ne lancez **pas** seulement la fin de `011` ou un UPDATE manuel sans avoir les colonnes `workshop_id`.
