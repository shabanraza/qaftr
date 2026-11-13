/**
 * Where Google Analytics may run. GA is only injected for a configured
 * measurement ID on the production host (SITE_URL and its www variant), never
 * on localhost, *.workers.dev / *.pages.dev previews or staging subdomains.
 */

export const CONSENT_STORAGE_KEY = 'qaftr:analytics-consent'

const MEASUREMENT_ID_RE = /^G-[A-Z0-9]{4,20}$/

const DEV_HOST_RE =
  /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$|\.localhost$|\.test$|\.workers\.dev$|\.pages\.dev$/i

export function isValidMeasurementId(id: string | undefined | null): id is string {
  return typeof id === 'string' && MEASUREMENT_ID_RE.test(id)
}

/** Hostnames that count as production for a site URL (empty for dev URLs). */
export function productionHosts(siteUrl: string): string[] {
  let host: string
  try {
    host = new URL(siteUrl).hostname.toLowerCase()
  } catch {
    return []
  }
  if (!host || DEV_HOST_RE.test(host)) return []
  const bare = host.replace(/^www\./, '')
  return [bare, `www.${bare}`]
}

export function isProductionHost(hostname: string, siteUrl: string): boolean {
  const host = hostname.toLowerCase()
  if (!host || DEV_HOST_RE.test(host)) return false
  return productionHosts(siteUrl).includes(host)
}

export function shouldLoadAnalytics({
  measurementId,
  hostname,
  siteUrl,
}: {
  measurementId: string | undefined | null
  hostname: string
  siteUrl: string
}): boolean {
  return isValidMeasurementId(measurementId) && isProductionHost(hostname, siteUrl)
}

/**
 * Inline <head> script: checks the host (same rule as isProductionHost), sets
 * Consent Mode v2 defaults to denied, re-applies a remembered grant, then
 * configures GA and loads gtag.js. Returns '' for an invalid ID.
 *
 * `window.__qaftrAnalyticsForce = true` (set by the e2e suite before load)
 * bypasses the host check so events can be asserted on localhost; gtag.js is
 * stubbed there.
 */
export function buildGtagBootstrap({
  measurementId,
  siteUrl,
}: {
  measurementId: string | undefined | null
  siteUrl: string
}): string {
  if (!isValidMeasurementId(measurementId)) return ''
  const hosts = JSON.stringify(productionHosts(siteUrl))
  const id = JSON.stringify(measurementId)
  const key = JSON.stringify(CONSENT_STORAGE_KEY)
  return (
    '(function(w,d){' +
    `var h=String(w.location.hostname||'').toLowerCase();` +
    `if(!w.__qaftrAnalyticsForce&&${hosts}.indexOf(h)<0)return;` +
    'w.dataLayer=w.dataLayer||[];' +
    'function gtag(){w.dataLayer.push(arguments);}' +
    'w.gtag=gtag;' +
    "gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});" +
    `var c=null;try{c=w.localStorage.getItem(${key});}catch(e){}` +
    "if(c==='granted')gtag('consent','update',{analytics_storage:'granted'});" +
    "gtag('js',new Date());" +
    `gtag('config',${id});` +
    'w.__qaftrAnalytics=true;' +
    `var s=d.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+${id};d.head.appendChild(s);` +
    '})(window,document);'
  )
}
