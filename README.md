# AT72Manager

Application desktop professionnelle pour Windows, construite avec **React**, **Vite**, **Tailwind CSS** et **Tauri**.

## Prérequis

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install)
- Outils de build Windows pour Tauri ([WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) est généralement déjà installé sur Windows 10/11)

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Lance le frontend Vite (navigateur) |
| `npm run dev:tauri` | Lance l'application desktop Tauri en mode développement |
| `npm run build` | Build le frontend pour la production |
| `npm run build:tauri` | Build l'installateur / exécutable Windows |
| `npm run lint` | Analyse ESLint |
| `npm run typecheck` | Vérification TypeScript |

## Structure du projet

```
src/
├── app/                 # Point d'entrée React, providers
├── components/
│   ├── layout/          # Shell, sidebar, header
│   └── ui/                # Composants UI réutilisables
├── features/              # Modules métier (dashboard, etc.)
├── hooks/
├── lib/                   # Utilitaires
├── styles/                # Thème global et styles
└── types/
src-tauri/                 # Backend Rust / configuration Tauri
```

## Démarrage rapide

```bash
npm install
npm run dev:tauri
```
