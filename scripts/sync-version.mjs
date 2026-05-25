import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf-8'))
const version = pkg.version

const tauriConfPath = path.join(root, 'src-tauri', 'tauri.conf.json')
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'))
tauriConf.version = version
writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`)

const cargoPath = path.join(root, 'src-tauri', 'Cargo.toml')
let cargo = readFileSync(cargoPath, 'utf-8')
cargo = cargo.replace(/^version = ".*"$/m, `version = "${version}"`)
writeFileSync(cargoPath, cargo)

console.log(`Version synchronisée : ${version}`)
