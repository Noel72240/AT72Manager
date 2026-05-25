# Portail client web — déploiement (portal.allotech72.fr)

## Architecture

| Composant | Hébergement | URL type |
|-----------|-------------|----------|
| App atelier | Desktop Tauri (Windows) | — |
| Portail client | **Vercel** (SPA) | `https://portal.allotech72.fr` |

Le portail est un **build séparé** (`dist-portal/`), sans HashRouter localhost.

## Build local

```bash
# 1. Config (copier l’exemple)
copy .env.portal.production.example .env.portal.production
# Renseigner Supabase + VITE_PORTAL_PUBLIC_URL

# 2. Build
npm run build:portal

# 3. Prévisualiser
npm run preview:portal
```

Sortie : `dist-portal/` (servi comme site statique).

## Déploiement Vercel

### 1. Projet Vercel

1. Importer le dépôt GitHub/GitLab
2. Framework : **Other**
3. Build Command : `npm run build:portal`
4. Output Directory : `dist-portal`
5. Install Command : `npm ci`

(`vercel.json` à la racine applique déjà ces valeurs.)

### 2. Variables d’environnement (Production)

| Variable | Exemple | Obligatoire |
|----------|---------|-------------|
| `VITE_PORTAL_STANDALONE` | `true` | Oui |
| `VITE_APP_ENV` | `production` | Oui |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` | Oui |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_…` | Oui |
| `VITE_PORTAL_PUBLIC_URL` | `https://portal.allotech72.fr` | Oui |
| `VITE_APP_VERSION` | `1.0.0` | Non |

Ne pas exposer de clé `service_role` côté client.

### 3. Domaine custom

Vercel → Project → Settings → Domains :

- `portal.allotech72.fr` (CNAME vers Vercel)

DNS chez votre registrar :

```
portal.allotech72.fr  CNAME  cname.vercel-dns.com
```

### 4. Supabase Auth (obligatoire)

Dashboard Supabase → **Authentication** → **URL Configuration** :

| Champ | Valeur |
|-------|--------|
| Site URL | `https://portal.allotech72.fr` |
| Redirect URLs | `https://portal.allotech72.fr/**` |

Ajoutez aussi en dev : `http://localhost:4173/**` (preview Vite).

**Email templates** : liens de confirmation doivent pointer vers le portail public, pas `localhost`.

### 5. App desktop — lien portail

Dans `.env.production` (build Tauri) :

```env
VITE_PORTAL_PUBLIC_URL=https://portal.allotech72.fr
```

L’atelier copie alors l’URL d’inscription **publique** depuis la fiche client (plus de `localhost`).

## Routing production

| Route | Page |
|-------|------|
| `/` | Tableau de bord client |
| `/login` | Connexion |
| `/register` | Inscription (code atelier) |
| `/interventions` | Suivi réparations |
| `/messages` | Messagerie |
| `/quotes`, `/invoices` | Devis / factures |
| `/notifications` | Notifications |

Vercel `rewrites` → `index.html` (SPA).

## Sécurité (RLS Supabase)

Déjà en place (migration `011_client_portal.sql`) :

- **`client_accounts`** : un client ne voit que son compte (`auth_user_id = auth.uid()`)
- **Données métier** : `SELECT` limité à `current_client_id()` (interventions, devis, factures…)
- **`portal_messages`** : client ↔ atelier isolés par `client_id` / `workshop_id`
- **Atelier** : policies `*_workshop` pour le personnel authentifié

Le portail web utilise uniquement la clé **anon** + session Auth client.

Vérifications :

1. Compte client A ne voit pas les données du client B
2. Utilisateur atelier (staff) ne peut pas utiliser le portail comme client sans `client_accounts`
3. RPC `lookup_client_by_portal_code` / `link_portal_client_account` (migration 014)

## Fonctionnalités vérifiées en mode web

| Fonction | Mode web |
|----------|----------|
| Suivi réparation | OK (Supabase + timeline) |
| Messagerie | OK |
| Devis / factures | OK (lecture + PDF) |
| Notifications | OK |
| Hors-ligne | Cache **localStorage** (lecture seule) |

## Google OAuth

**Non utilisé** sur le portail client. Google Calendar reste sur l’app desktop atelier uniquement.

## Checklist mise en production

- [ ] `.env.portal.production` ou variables Vercel renseignées
- [ ] `npm run build:portal` sans erreur
- [ ] Domaine `portal.allotech72.fr` actif (HTTPS)
- [ ] Supabase redirect URLs configurées
- [ ] Test inscription avec code atelier réel
- [ ] Test login + messagerie + intervention sur smartphone
- [ ] Desktop : `VITE_PORTAL_PUBLIC_URL` dans build atelier

## Dépannage

| Problème | Solution |
|----------|----------|
| Page blanche après deploy | Vérifier `dist-portal/index.html` (script postbuild) |
| Email confirmation → localhost | Corriger Site URL Supabase |
| « Compte non lié » | Migration 014 + code portail valide |
| Ancien lien `/#/portal` | Utiliser `https://portal.allotech72.fr/register` |
