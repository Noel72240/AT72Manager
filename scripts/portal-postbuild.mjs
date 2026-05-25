import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'dist-portal')
const portalHtml = path.join(outDir, 'portal.html')
const indexHtml = path.join(outDir, 'index.html')

if (!existsSync(portalHtml)) {
  console.error('Build portail incomplet: dist-portal/portal.html absent')
  process.exit(1)
}

copyFileSync(portalHtml, indexHtml)
console.log('dist-portal/index.html genere pour Vercel')
