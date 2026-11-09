import { regionFromPath } from './lang'
import type { MarketingLang, MarketingRegion } from './lang'

/**
 * Saudi ↔ UAE page equivalents (docs/COMPETITOR_UX_SPEC_2026-11-09.md §1.3).
 * Pairs drive the region picker, the geo banner and the joined hreflang
 * clusters. Pages without a pair map to the other region's home (picker only;
 * they are not hreflang alternates).
 */
export const REGION_PAIRS: ReadonlyArray<{ sa: string; ae: string }> = [
  { sa: '/', ae: '/ae' },
  { sa: '/tools/vat-calculator', ae: '/ae/tools/vat-calculator' },
  { sa: '/tools/trn-checker', ae: '/ae/tools/trn-checker' },
  { sa: '/tools/fatora', ae: '/ae/tools/invoice-generator' },
  { sa: '/tools/zatca-wave-checker', ae: '/ae/tools/e-invoicing-readiness' },
  { sa: '/guides/zatca-wave-25', ae: '/ae/guides/uae-e-invoicing-2027' },
]

export const REGION_HOME: Record<MarketingRegion, string> = { sa: '/', ae: '/ae' }

export const REGION_COOKIE = 'qaftr_region'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function normalizePath(pathname: string) {
  const path = pathname.split(/[?#]/)[0] || '/'
  return path.length > 1 ? path.replace(/\/+$/, '') || '/' : path
}

export function otherRegion(region: MarketingRegion): MarketingRegion {
  return region === 'sa' ? 'ae' : 'sa'
}

/** The paired page in the other region, or null if the page has no pair. */
export function counterpartPath(pathname: string): string | null {
  const path = normalizePath(pathname)
  const region = regionFromPath(path)
  const pair = REGION_PAIRS.find((p) => p[region] === path)
  return pair ? pair[otherRegion(region)] : null
}

/** Where the picker sends a visitor on `pathname` who chooses `target`. */
export function equivalentPath(pathname: string, target: MarketingRegion): string {
  const path = normalizePath(pathname)
  if (regionFromPath(path) === target) return path
  return counterpartPath(path) ?? REGION_HOME[target]
}

export function regionHref(
  pathname: string,
  target: MarketingRegion,
  lang: MarketingLang,
): string {
  const path = equivalentPath(pathname, target)
  return lang === 'en' ? `${path}?lang=en` : path
}

export function regionCookieString(region: MarketingRegion, secure: boolean) {
  return `${REGION_COOKIE}=${region}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`
}

export function readRegionCookie(cookieHeader: string | null | undefined): MarketingRegion | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [name, value] = part.trim().split('=')
    if (name === REGION_COOKIE && (value === 'sa' || value === 'ae')) return value
  }
  return null
}

/** Browser only: remember the visitor's region choice. */
export function rememberRegion(region: MarketingRegion) {
  if (typeof document === 'undefined') return
  document.cookie = regionCookieString(region, window.location.protocol === 'https:')
}

export function countryToRegion(country: string | null | undefined): MarketingRegion | null {
  const code = country?.toUpperCase()
  if (code === 'AE') return 'ae'
  if (code === 'SA') return 'sa'
  return null
}

/** The region to suggest in the geo banner, or null for no banner. */
export function suggestRegion({
  country,
  pageRegion,
  cookieRegion,
}: {
  country: string | null
  pageRegion: MarketingRegion
  cookieRegion: MarketingRegion | null
}): MarketingRegion | null {
  if (cookieRegion) return null
  const visitorRegion = countryToRegion(country)
  return visitorRegion && visitorRegion !== pageRegion ? visitorRegion : null
}

const BOT_UA =
  /bot\b|bot\/|crawl|spider|slurp|facebookexternalhit|embedly|lighthouse|bingpreview|mediapartners|whatsapp|telegram|curl|wget|python-requests|httpclient|go-http/i

/** Crawlers (and requests without a UA) never get the geo banner. */
export function isBotUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return true
  return BOT_UA.test(ua)
}

function isLocalHost(host: string) {
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0]
  return (
    name === 'localhost' ||
    name === '127.0.0.1' ||
    name === '[::1]' ||
    name.endsWith('.localhost')
  )
}

function validCountry(code: string | null | undefined): string | null {
  const upper = code?.trim().toUpperCase()
  if (!upper || !/^[A-Z]{2}$/.test(upper)) return null
  // Cloudflare: XX = unknown, T1 = Tor.
  if (upper === 'XX' || upper === 'T1') return null
  return upper
}

/**
 * Visitor country. Production: Cloudflare (`request.cf.country`, then the
 * CF-IPCountry header). Local dev/e2e: only the `?_geo=` override, so the dev
 * machine's own location (miniflare's cf.json) never shows a banner.
 */
export function resolveGeoCountry({
  host,
  override,
  cfCountry,
  headerCountry,
}: {
  host: string
  override?: string | null
  cfCountry?: string | null
  headerCountry?: string | null
}): string | null {
  if (isLocalHost(host)) return validCountry(override)
  return validCountry(cfCountry) ?? validCountry(headerCountry)
}
