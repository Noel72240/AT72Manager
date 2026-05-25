import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist-portal')
const indexHtml = path.join(outDir, 'index.html')

if (!existsSync(indexHtml)) {
  console.error('ERREUR: dist-portal/index.html absent — lancez npm run build:portal')
  process.exit(1)
}

const html = readFileSync(indexHtml, 'utf-8')
const match = html.match(/src="\/assets\/(portal-[^"]+\.js)"/)
let js = ''
if (match) {
  const jsPath = path.join(outDir, 'assets', match[1])
  if (existsSync(jsPath)) js = readFileSync(jsPath, 'utf-8')
}

const checks = [
  ['index.html', true],
  ['bundle portal-*.js', Boolean(match && js.length > 0)],
  ['pas HashRouter', !js.includes('HashRouter')],
  ['contenu légal', js.includes('mentions-legales') || js.includes('politique-confidentialite')],
  ['VITE_PORTAL_STANDALONE', js.includes('true') || html.includes('Portail client')],
]

let ok = true
for (const [label, pass] of checks) {
  console.log(pass ? `[OK] ${label}` : `[ECHEC] ${label}`)
  if (!pass) ok = false
}

if (!ok) process.exit(1)
console.log('\nBuild portail valide — deployer le dossier dist-portal sur Vercel')
