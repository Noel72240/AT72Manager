# Sauvegarde & restauration AT72Manager

Système professionnel pour protéger les données atelier **avant commercialisation**.

## Contenu des sauvegardes

| Section | Store IndexedDB | Description |
|--------|-----------------|-------------|
| clients | `clients` | Fiches clients |
| devices | `devices` | Appareils |
| interventions | `interventions` | Dossiers SAV |
| interventionPhotos | `intervention_photos` | Photos |
| quotes / invoices | `quotes`, `invoices` | Devis & factures |
| spareParts / stockMovements | stock | Pièces & mouvements |
| activityFeed | `activity_feed` | Fil d’activité / notifications |
| aiConversations | `ai_conversations` | Historique IA |
| calendarLinks / calendarQueue | planning Google | Liens agenda & file sync |
| settings | `meta` | Numérotation documents, préférences backup |

**Hors scope local** (re-synchronisés via Supabase après restauration) :

- Messages portail client (`portal_messages` cloud)
- Cache portail (`portal_cache`)

## Formats

- **JSON** : audit, diff, intégrité SHA-256 lisible
- **ZIP** : export multi-fichier compressé (recommandé multi-PC)
- **Snapshots locaux** : métadonnées + payload gzip (si &lt; 12 Mo) dans `backup_snapshots`

Manifest : `formatVersion`, `appVersion`, `dbVersion`, `checksumSha256`.

## Flux restauration

1. Vérification SHA-256 + format `at72manager`
2. Compatibilité `dbVersion` (refus si sauvegarde &gt; app)
3. Normalisation sections manquantes (anciennes sauvegardes)
4. Snapshot **« Avant restauration »** (sauf dry-run)
5. Remplacement transactionnel par store (`clear` + `put`)
6. En cas d’erreur : **rollback automatique** vers le snapshot pré-restauration
7. Rechargement application (`location.reload`)

## Fonctions UI (Paramètres → Sauvegarde)

- Export JSON / ZIP
- Import complet ou **sélectif** (clients, stock, paramètres, etc.)
- **Dry-run** : simulation sans écriture IDB
- **Rollback** sur snapshot (si payload local présent)
- **Test automatique** : créer client test → export → supprimer → restaurer → comparer

## Multi-PC, offline, cloud

- **Offline** : export/import fichier + snapshots IndexedDB
- **Multi-PC** : copier le `.zip` / `.json` ; même `userId` requis à l’import
- **Supabase Storage** : option `cloudEnabled` + bucket `backups` — **création obligatoire** : voir [SUPABASE_BACKUP_BUCKET.md](./SUPABASE_BACKUP_BUCKET.md)

## Logs

Console : `[backup:code] message`.  
UI : panneau « Journal de restauration » après import / rollback / dry-run.

## Test manuel recommandé

1. Créer 2 clients + 1 intervention
2. Export ZIP
3. Supprimer un client
4. Dry-run du ZIP → vérifier compteurs
5. Restaurer clients seulement → client réapparaît
6. Rollback sur snapshot « Avant restauration »
7. Lancer « Test automatique backup »

## Limitations connues

- Snapshots très volumineux : payload gzip non stocké → rollback timeline désactivé ; utiliser le fichier exporté
- Messages portail : pas dans l’archive locale ; sync Supabase après restore
