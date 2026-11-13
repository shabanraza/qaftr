/**
 * Public, indexable pages. Drives seo.spec and layout.spec: adding a page is
 * one line here. Rules (src/lib/marketing/seo.ts + lang.ts):
 *  - Arabic is the default: canonical = https://qaftr.com + path (clean URL).
 *  - English: canonical = …?lang=en.
 *  - Saudi (sa): html lang ar-SA/rtl | en/ltr; hreflang ar-SA, en-SA, x-default.
 *  - UAE (ae, under /ae): html lang ar-AE/rtl | en-AE/ltr; hreflang ar-AE, en-AE.
 *  - SA↔AE equivalents (REGION_PAIRS) share one cluster: ar-SA, en-SA, ar-AE,
 *    en-AE, x-default = Saudi Arabic.
 */
export const SITE_URL = 'https://qaftr.com'

export type Region = 'sa' | 'ae'
export type Lang = 'ar' | 'en'

export type PageEntry = {
  path: string
  region: Region
  /** Extra tags for the generated tests, e.g. '@smoke'. */
  tags?: string[]
}

export const PAGES: PageEntry[] = [
  { path: '/', region: 'sa', tags: ['@smoke'] },
  { path: '/tools', region: 'sa' },
  { path: '/tools/fatora', region: 'sa' },
  { path: '/tools/vat-calculator', region: 'sa' },
  { path: '/tools/trn-checker', region: 'sa' },
  { path: '/tools/zatca-wave-checker', region: 'sa' },
  { path: '/tools/quotation', region: 'sa' },
  { path: '/tools/receipt-voucher', region: 'sa' },
  { path: '/tools/credit-note', region: 'sa' },
  { path: '/tools/non-tax-invoice', region: 'sa' },
  { path: '/tools/zatca-qr', region: 'sa' },
  { path: '/tools/zatca-xml-validator', region: 'sa' },
  { path: '/guides/zatca-wave-25', region: 'sa' },
  { path: '/zatca-invoice-generator', region: 'sa' },
  { path: '/free-invoice-generator', region: 'sa' },
  { path: '/invoice-generator-saudi-arabia', region: 'sa' },
  { path: '/vat-invoice-generator-saudi-arabia', region: 'sa' },
  { path: '/e-invoicing-saudi-arabia', region: 'sa' },
  { path: '/small-business-invoicing-saudi-arabia', region: 'sa' },
  { path: '/support', region: 'sa' },
  { path: '/privacy', region: 'sa' },
  { path: '/ae', region: 'ae', tags: ['@smoke'] },
  { path: '/ae/tools/trn-checker', region: 'ae' },
  { path: '/ae/tools/vat-calculator', region: 'ae' },
  { path: '/ae/tools/invoice-generator', region: 'ae' },
  { path: '/ae/tools/e-invoicing-readiness', region: 'ae' },
  { path: '/ae/guides/uae-e-invoicing-2027', region: 'ae' },
]

const HTML_LANG: Record<Region, { ar: string; en: string }> = {
  sa: { ar: 'ar-SA', en: 'en' },
  ae: { ar: 'ar-AE', en: 'en-AE' },
}

const HREFLANG: Record<Region, { ar: string; en: string }> = {
  sa: { ar: 'ar-SA', en: 'en-SA' },
  ae: { ar: 'ar-AE', en: 'en-AE' },
}

/**
 * Saudi ↔ UAE equivalents (docs/COMPETITOR_UX_SPEC_2026-11-09.md §1.3).
 * Paired pages share one hreflang cluster; x-default = Saudi Arabic.
 * Kept independent of src/lib/marketing/regions.ts on purpose.
 */
export const REGION_PAIRS: Array<{ sa: string; ae: string }> = [
  { sa: '/', ae: '/ae' },
  { sa: '/tools/vat-calculator', ae: '/ae/tools/vat-calculator' },
  { sa: '/tools/trn-checker', ae: '/ae/tools/trn-checker' },
  { sa: '/tools/fatora', ae: '/ae/tools/invoice-generator' },
  { sa: '/tools/zatca-wave-checker', ae: '/ae/tools/e-invoicing-readiness' },
  { sa: '/guides/zatca-wave-25', ae: '/ae/guides/uae-e-invoicing-2027' },
]

export function pageUrl(path: string, lang: Lang) {
  return lang === 'en' ? `${path}?lang=en` : path
}

export function hreflangCluster(page: PageEntry): Record<string, string> {
  const pair = REGION_PAIRS.find((p) => p[page.region] === page.path)
  const paths: Partial<Record<Region, string>> = pair ? { ...pair } : { [page.region]: page.path }
  const cluster: Record<string, string> = {}
  for (const region of ['sa', 'ae'] as const) {
    const path = paths[region]
    if (!path) continue
    cluster[HREFLANG[region].ar] = `${SITE_URL}${path}`
    cluster[HREFLANG[region].en] = `${SITE_URL}${path}?lang=en`
  }
  cluster['x-default'] = `${SITE_URL}${paths.sa ?? page.path}`
  return cluster
}

export function expectedSeo(page: PageEntry, lang: Lang) {
  const ar = `${SITE_URL}${page.path}`
  const en = `${ar}?lang=en`
  return {
    lang: HTML_LANG[page.region][lang],
    dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const),
    canonical: lang === 'en' ? en : ar,
    hreflang: hreflangCluster(page),
    robots: 'index, follow',
  }
}
