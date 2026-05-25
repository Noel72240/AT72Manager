import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.production')

function parseEnv(content) {
  const vars = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    vars[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return vars
}

function mask(value) {
  if (!value) return '(vide)'
  if (value.length <= 12) return '***'
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

const required = [
  'VITE_APP_ENV',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]

const recommended = ['VITE_GOOGLE_CLIENT_ID', 'VITE_APP_VERSION']

if (!existsSync(envPath)) {
  console.error('ERREUR: .env.production absent. Copiez .env.production.example')
  process.exit(1)
}

const vars = parseEnv(readFileSync(envPath, 'utf-8'))
let errors = 0
let warnings = 0

for (const key of required) {
  if (!vars[key]?.trim()) {
    console.error(`ERREUR: ${key} manquant`)
    errors++
  }
}

if (vars.VITE_APP_ENV !== 'production') {
  console.error('ERREUR: VITE_APP_ENV doit être "production"')
  errors++
}

const url = vars.VITE_SUPABASE_URL ?? ''
if (!url.includes('.supabase.co')) {
  console.error('ERREUR: VITE_SUPABASE_URL invalide')
  errors++
}

const key = vars.VITE_SUPABASE_ANON_KEY ?? ''
if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
  console.error('ERREUR: VITE_SUPABASE_ANON_KEY format invalide')
  errors++
}

for (const key of recommended) {
  if (!vars[key]?.trim()) {
    console.warn(`AVERTISSEMENT: ${key} non défini`)
    warnings++
  }
}

const googleId = vars.VITE_GOOGLE_CLIENT_ID ?? ''
if (googleId && !googleId.endsWith('.apps.googleusercontent.com')) {
  console.warn('AVERTISSEMENT: VITE_GOOGLE_CLIENT_ID format inhabituel')
  warnings++
}

console.log('\n--- Résumé .env.production ---')
console.log(`VITE_APP_ENV=${vars.VITE_APP_ENV}`)
console.log(`VITE_SUPABASE_URL=${url}`)
console.log(`VITE_SUPABASE_ANON_KEY=${mask(key)}`)
console.log(`VITE_GOOGLE_CLIENT_ID=${googleId ? mask(googleId) : '(non configuré)'}`)
console.log(`VITE_APP_VERSION=${vars.VITE_APP_VERSION ?? '(défaut package.json)'}`)

if (errors > 0) {
  console.error(`\n${errors} erreur(s) — corrigez avant le build.`)
  process.exit(1)
}

console.log(`\nOK — prêt pour build production (${warnings} avertissement(s)).`)
