// Stamps <lastmod> on every URL in public/sitemap.xml from git history.
// A page's date is the newest commit that touched its route file or the files
// that hold its copy. Run `npm run sitemap:lastmod` after content changes and
// commit the result. It needs full git history, so it is not a build step.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const sitemapPath = resolve(root, 'public/sitemap.xml')

const i18n = ['src/lib/marketing/i18n.ts']
const docs = ['src/lib/documents/copy.ts', 'src/lib/documents/pages.ts']
const ae = ['src/lib/ae/copy.ts', 'src/lib/ae/pages.ts', 'src/lib/ae/guide-content.ts', 'src/lib/ae/readiness-quiz.ts']

/** Files besides the route file that hold a page's copy. */
function contentFiles(path) {
  if (path === '/') return [...i18n, 'src/lib/marketing/home-content.ts']
  if (['/support', '/privacy', '/terms', '/refund'].includes(path)) return i18n
  if (path.startsWith('/ae')) return ae
  if (path === '/guides/zatca-wave-25') return ['src/lib/sa/wave-guide-content.ts', 'src/lib/guides/content.ts']
  if (path.startsWith('/guides')) return ['src/lib/guides/content.ts']
  if (path === '/tools/zatca-wave-checker') return ['src/lib/sa/wave-copy.ts']
  if (path === '/tools/zatca-qr') return ['src/lib/sa/qr-copy.ts']
  if (path === '/tools/zatca-xml-validator') return ['src/lib/sa/xml-validator-copy.ts']
  if (['/tools/quotation', '/tools/receipt-voucher', '/tools/credit-note', '/tools/non-tax-invoice'].includes(path)) return docs
  if (path === '/tools/fatora') return ['src/lib/tools/copy.ts', 'src/lib/tools/fatora-faq.ts']
  if (path.startsWith('/tools')) return ['src/lib/tools/copy.ts']
  return ['src/lib/sa/pages.ts']
}

function routeFiles(path) {
  const base = path === '/' ? 'index' : path.slice(1)
  return [`src/routes/${base}.tsx`, `src/routes/${base}/index.tsx`]
}

function lastCommitDate(files) {
  const existing = files.filter((f) => existsSync(resolve(root, f)))
  if (existing.length === 0) return null
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...existing], { cwd: root, encoding: 'utf-8' }).trim()
  return out || null
}

const xml = readFileSync(sitemapPath, 'utf-8')
const dates = new Map()
let missing = 0

const stamped = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1]
  if (!loc) return block
  const path = loc.replace('https://qaftr.com', '').replace('?lang=en', '') || '/'
  if (!dates.has(path)) dates.set(path, lastCommitDate([...routeFiles(path), ...contentFiles(path)]))
  const date = dates.get(path)
  if (!date) {
    missing += 1
    console.warn(`no git date for ${path}; leaving its lastmod as is`)
    return block
  }
  const withoutOld = block.replace(/\s*<lastmod>[^<]*<\/lastmod>/g, '')
  return withoutOld.replace(/(<loc>[^<]+<\/loc>)/, `$1\n    <lastmod>${date}</lastmod>`)
})

writeFileSync(sitemapPath, stamped)
console.log(`Stamped ${dates.size} pages${missing ? `, ${missing} without a git date` : ''}.`)
