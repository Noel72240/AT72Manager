import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const candidates = ['.env.portal-production', '.env.portal.production', '.env.production', '.env']

let content = ''
let source = ''
for (const name of candidates) {
  const p = path.join(root, name)
  if (existsSync(p)) {
    content = readFileSync(p, 'utf-8')
    source = name
    break
  }
}

if (!content) {
  console.error('Aucun fichier .env.portal.production / .env.production trouve')
  process.exit(1)
}

const vars = {}
for (const line of content.split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#')) continue
  const i = t.indexOf('=')
  if (i === -1) continue
  vars[t.slice(0, i).trim()] = t.slice(i + 1).trim()
}

let ok = true
const need = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
for (const k of need) {
  if (!vars[k]) {
    console.error(`ERREUR [${source}]: ${k} manquant`)
    ok = false
  }
}

const standalone = vars.VITE_PORTAL_STANDALONE === 'true'
const portalUrl = vars.VITE_PORTAL_PUBLIC_URL ?? ''

console.log(`Fichier: ${source}`)
console.log(`VITE_PORTAL_STANDALONE=${standalone ? 'true' : vars.VITE_PORTAL_STANDALONE ?? '(absent)'}`)
console.log(`VITE_PORTAL_PUBLIC_URL=${portalUrl || '(defaut build)'}`)
console.log(`VITE_SUPABASE_URL=${vars.VITE_SUPABASE_URL ?? ''}`)

if (!ok) process.exit(1)
console.log('OK — pret pour build:portal')
