# Créer le bucket Supabase `backups`

AT72Manager envoie les sauvegardes ZIP vers **Supabase Storage**, bucket **`backups`**, chemin :

```text
{votre_user_id}/{date-heure}.zip
```

Sans ce bucket, l’upload cloud échoue (erreur du type *Bucket not found*).

---

## Méthode 1 — SQL (recommandée, 1 minute)

1. Ouvrez [Supabase Dashboard](https://supabase.com/dashboard) → votre projet **AT72Manager**
2. Menu **SQL Editor** → **New query**
3. Copiez-collez le fichier du projet :
   `supabase/migrations/015_backups_storage_bucket.sql`
4. Cliquez **Run**

Vous devez voir le bucket dans **Storage** → **Buckets** → `backups` (privé, non public).

---

## Méthode 2 — Interface graphique

1. **Storage** → **New bucket**
2. Paramètres :
   - **Name** : `backups` (exactement, minuscules)
   - **Public bucket** : **désactivé** (privé)
   - **File size limit** : `100` MB (ou plus si grosses bases)
   - **Allowed MIME types** (optionnel) : `application/zip`, `application/json`
3. Créer le bucket
4. Onglet **Policies** du bucket → ajouter les règles RLS (sinon l’app ne pourra pas uploader)

Pour les policies, préférez la **méthode 1** (SQL complet déjà prêt).

---

## Activer le cloud dans AT72Manager

1. Connectez-vous à l’app (compte Supabase Auth = même `user id` que les sauvegardes)
2. **Paramètres** → onglet **Sauvegarde**
3. Cochez **Sauvegarde cloud**
4. Choisissez **Supabase Storage**
5. **Enregistrer**
6. Faites un **Export ZIP** ou une sauvegarde manuelle

Dans l’historique, le snapshot doit afficher l’icône **Cloud** si l’upload a réussi.

---

## Vérifier dans Supabase

**Storage** → **backups** → vous devez voir un dossier = UUID de votre utilisateur → fichiers `.zip`.

---

## Dépannage

| Erreur | Cause | Solution |
|--------|--------|----------|
| Bucket not found | Bucket absent | Exécuter `015_backups_storage_bucket.sql` |
| new row violates row-level security | Policies manquantes | Relancer le SQL des policies |
| Payload too large | ZIP &gt; limite bucket | Augmenter `file_size_limit` dans le bucket |
| Supabase non configuré | `.env` sans URL/clé | Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` |
| Rollback cloud OK mais intervention absente | Supabase avait encore la suppression | Corrigé : restauration réinjecte les données dans Supabase + vide la file sync |

### Rollback depuis le cloud

Si le snapshot affiche **Cloud** sans payload local, le rollback **télécharge le ZIP** depuis Supabase Storage puis restaure.  
Après restauration, les interventions/clients sont **recréés dans Supabase** (pas seulement en local).

---

## Variables d’environnement

Déjà requises pour l’app (rien de spécifique au bucket) :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Le client utilise la **session utilisateur** connectée ; pas besoin de clé `service_role` côté app.
