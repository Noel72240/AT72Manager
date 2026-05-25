import { copyFileSync, cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
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

let html = readFileSync(indexHtml, 'utf-8')
const version = process.env.npm_package_version ?? '1.0.0'
const stamp = `<!-- AT72 portal build ${version} ${new Date().toISOString()} -->`
if (!html.includes('AT72 portal build')) {
  html = html.replace('<head>', `<head>\n    ${stamp}`)
  writeFileSync(indexHtml, html)
}

if (existsSync(path.join(root, 'public'))) {
  cpSync(path.join(root, 'public'), outDir, { recursive: true })
}

const iconSrc = path.join(root, 'src-tauri', 'icons', 'icon.png')
if (existsSync(iconSrc)) {
  copyFileSync(iconSrc, path.join(outDir, 'app-icon.png'))
}

console.log('dist-portal pret pour Vercel (index.html + assets publics)')
