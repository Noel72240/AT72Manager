# Portail client AT72Manager

## Accès

- **Connexion** : `/#/portal/login`
- **Inscription** : `/#/portal/register` (code d’accès atelier requis)

## Activation côté atelier

1. Appliquer les migrations dans l'ordre : **`012_multi_workshop_foundation.sql`** puis **`011_client_portal.sql`** (voir `docs/SUPABASE_MIGRATIONS.md`)
2. Ouvrir la fiche client → section **Portail client SAV**
3. Cliquer **Activer le portail** → communiquer le **code d’accès** au client
4. Le client crée son compte avec email + mot de passe + code

## Sécurité (RLS)

- Chaque client ne voit que ses données (`client_id` via `client_accounts`)
- Tables dédiées : messages, notifications, timeline, validations devis, signatures
- Le personnel atelier conserve les policies `workshop_id` existantes

## Fonctionnalités

- Dashboard, réparations + timeline SAV, RDV, devis (validation + signature), factures PDF, historique, messagerie, notifications
- Cache offline IndexedDB (`portal_cache`, v14)
- Flags futurs : paiement, RDV en ligne, push, app mobile, IA
