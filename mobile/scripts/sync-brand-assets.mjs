import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const mobileRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDir = join(mobileRoot, 'assets')
const publicDir = join(mobileRoot, '..', 'invoice-app', 'public')

const brandFiles = [
  'favicon.ico',
  'favicon-32.png',
  'logo192.png',
  'logo512.png',
  'og-image.png',
]

mkdirSync(publicDir, { recursive: true })

for (const file of brandFiles) {
  copyFileSync(join(assetsDir, file), join(publicDir, file))
}

console.log(`Synced ${brandFiles.length} brand assets to invoice-app/public`)
