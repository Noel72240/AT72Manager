# Tester AT72Manager sur un autre PC (sans outils dev)

## Ce qu’il faut copier

Depuis la machine de build, copiez **un seul** de ces fichiers sur clé USB / réseau :

| Fichier | Emplacement après build |
|---------|-------------------------|
| Installateur recommandé | `src-tauri\target\release\bundle\nsis\AT72Manager_*_x64-setup.exe` |
| MSI (si WiX installé) | `src-tauri\target\release\bundle\msi\AT72Manager_*_x64_en-US.msi` |

Ne copiez pas le dossier `node_modules` ni le projet source.

## Prérequis sur le PC cible

- Windows 10/11 64 bits
- **WebView2 Runtime** (souvent déjà présent ; sinon installé par le setup Tauri)
- Connexion Internet pour Supabase / Google (hors-ligne partiel possible)

Aucun Node.js, Rust ou Visual Studio requis.

## Installation

1. Double-clic sur `AT72Manager_*_x64-setup.exe`
2. Choisir « Utilisateur actuel » ou « Tous les utilisateurs »
3. Lancer **AT72Manager** depuis le menu Démarrer

Données locales : `%AppData%\com.at72manager.desktop\`

## Premier lancement — checklist

1. **Connexion** avec un compte atelier déjà créé dans Supabase
2. **Synchroniser** (si bannière sync) — Paramètres ou barre sync
3. **Hors-ligne** : couper le Wi-Fi → ouvrir une intervention → doit s’ouvrir
4. **Google Calendar** : Paramètres → Intégrations → Connecter Google  
   - Utiliser un client OAuth type **Application de bureau** (voir ci-dessous)
5. **Portail client** : activer un client test, ouvrir le lien portail dans le navigateur

## Google OAuth sur PC installé

L’app desktop **n’utilise pas** `http://localhost:5173`.

Elle ouvre le navigateur puis reçoit le code sur `http://127.0.0.1:<port>` (loopback).

Dans Google Cloud Console :

1. Créer (ou utiliser) un client **Application de bureau**
2. Copier le **ID client** dans `.env.production` avant le build (`VITE_GOOGLE_CLIENT_ID`)
3. Activer l’API Google Calendar
4. Si vous aviez un client **Application Web** avec localhost uniquement → créez un client **Bureau** séparé pour l’installateur

## Logs en cas de problème

- Paramètres → Général → **Ouvrir le dossier des logs**
- Ou : `%AppData%\com.at72manager.desktop\logs\at72manager.log`
- Crashes : `%AppData%\com.at72manager.desktop\crashes\`

## Désinstallation

Paramètres Windows → Applications → AT72Manager → Désinstaller.

Pour effacer les données locales : supprimer `%AppData%\com.at72manager.desktop\`.
