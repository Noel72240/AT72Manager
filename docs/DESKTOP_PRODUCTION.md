# AT72Manager — déploiement desktop Windows (production)

Guide pour passer du mode développement (`localhost` / `tauri dev`) à un **logiciel installable** utilisable sur plusieurs postes atelier.

## Prérequis machine de build

| Outil | Usage |
|--------|--------|
| Node.js 20+ | Frontend + CLI Tauri |
| Rust (stable) | Backend desktop |
| Visual Studio Build Tools | Compilateur MSVC Windows |
| WebView2 Runtime | Inclus dans l’installateur récent |
| **NSIS** | Installateur `.exe` (géré par Tauri) |
| **WiX Toolset v3** | Package **MSI** (`candle` / `light`) |

## Configuration production

1. Copier `.env.production.example` → `.env.production`
2. Renseigner **Supabase production** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Google Calendar : client OAuth **Application de bureau** dans Google Cloud + `VITE_GOOGLE_CLIENT_ID`
4. Ne pas commiter `.env.production` (secrets intégrés au build Vite)

```bash
npm install
npm run icons:generate   # une fois — icônes src-tauri/icons/
npm run version:sync     # aligne package.json, tauri.conf, Cargo.toml
```

## Build release Windows

```powershell
.\scripts\build-windows-release.ps1
```

Ou manuellement :

```bash
npm run build:windows
```

### Artefacts générés

Dossier : `src-tauri/target/release/bundle/`

| Fichier | Description |
|---------|-------------|
| `nsis/*.exe` | Installateur graphique (recommandé utilisateurs) |
| `msi/*.msi` | Package MSI (déploiement IT / GPO) |
| `*.exe` (dossier release) | Binaire portable |

Identifiant application : `com.at72manager.desktop`  
Données utilisateur Windows : `%AppData%\com.at72manager.desktop\`

## Multi-PC & offline

- **IndexedDB** : base locale par poste (`AT72ManagerDB`), migrations automatiques + recovery
- **Supabase** : sync cloud ; chaque PC utilise le même projet Supabase + compte atelier (`workshop_id`)
- **Google Calendar** : OAuth loopback `127.0.0.1` (desktop) — tokens stockés localement par poste
- **Hors-ligne** : lecture/écriture locale ; file de sync au retour réseau

## Logs & crashs (production)

- Logs fichier : `%AppData%\com.at72manager.desktop\logs\at72manager.log`
- Rapports crash JSON : `%AppData%\...\crashes\`
- UI recovery : écran d’erreur → Recharger / Réinit. base / Ouvrir logs / Réinit. session
- Paramètres → Général → **Application desktop** → checklist + ouvrir logs

## Splashscreen

Le splash **React** (`StartupGate` + `StartupSplash`) reste l’écran de démarrage officiel (phases IndexedDB, sync, SAV). En production le timeout de secours est réduit (6 s).

## Sécurité build

- CSP production sans `localhost` (sauf `127.0.0.1` pour OAuth Google)
- `console` / `debugger` supprimés du bundle production
- Profil Rust `release` : LTO, `opt-level = "s"`, strip symboles
- Ne pas embarquer `.env` dans le dépôt ; rebuild pour changer les clés

## Signature code (recommandé)

Dans `src-tauri/tauri.conf.json` → `bundle.windows.certificateThumbprint` : certificat Authenticode pour éviter les alertes SmartScreen.

## Auto-update (préparé, désactivé)

- `bundle.createUpdaterArtifacts: false` (passer à `true` quand `TAURI_SIGNING_PRIVATE_KEY` est configurée)
- Plugin updater : `active: false` tant que `pubkey` et endpoint releases ne sont pas configurés
- Endpoint placeholder : `plugins.updater.endpoints` dans `tauri.conf.json`
- Étapes futures : héberger JSON + signatures, activer `tauri-plugin-updater`, renseigner clé publique

## Checklist avant déploiement atelier

- [ ] Migrations Supabase exécutées sur le projet **production**
- [ ] `.env.production` validé (Paramètres → Général → checklist verte)
- [ ] Test installateur sur un PC vierge (WebView2)
- [ ] Test login + sync + intervention hors-ligne → sync
- [ ] Test Google Calendar OAuth sur le même type de client OAuth « bureau »
- [ ] Sauvegarde / restauration JSON testée
- [ ] Portail client testé avec le même Supabase

## Dépannage build

| Erreur | Action |
|--------|--------|
| Icônes manquantes | `npm run icons:generate` |
| MSI échoue | Installer WiX Toolset v3, ajouter au PATH |
| Supabase KO en prod | Vérifier URL/clé dans `.env.production` puis rebuild |
| SmartScreen | Signer l’exécutable ou réputation progressive |

## Versioning

Modifier `version` dans `package.json`, puis :

```bash
npm run version:sync
```

Rebuild complet requis après changement de version.
