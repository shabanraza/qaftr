import { OG_IMAGE_URL, SITE_URL, SUPPORT_EMAIL } from './constants'
import type { MarketingLang, MarketingRegion } from './lang'
import { counterpartPath } from './regions'

type SeoMeta = {
  title: string
  description: string
  path?: string
  lang: MarketingLang
  /** Market the page targets. Defaults to Saudi Arabia ('sa'). */
  region?: MarketingRegion
  /** Force noindex. Private paths (/workspace, /invoices) are always noindex. */
  noindex?: boolean
}

const REGION_LOCALES: Record<
  MarketingRegion,
  {
    hreflangAr: string
    hreflangEn: string
    ogLocaleAr: string
    ogLocaleEn: string
    imageAlt: string
  }
> = {
  sa: {
    hreflangAr: 'ar-SA',
    hreflangEn: 'en-SA',
    ogLocaleAr: 'ar_SA',
    ogLocaleEn: 'en_US',
    imageAlt: 'Qaftr | قافتر — ZATCA Phase 1 invoicing for Saudi businesses',
  },
  ae: {
    hreflangAr: 'ar-AE',
    hreflangEn: 'en-AE',
    ogLocaleAr: 'ar_AE',
    ogLocaleEn: 'en_AE',
    imageAlt:
      'Qaftr | قافتر — Arabic-first invoicing and e-invoicing readiness for UAE businesses',
  },
}

const PRIVATE_PATH_PREFIXES = ['/workspace', '/invoices'] as const

export function isPrivatePath(path: string) {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

function withEnglish(url: string) {
  return `${url}${url.includes('?') ? '&' : '?'}lang=en`
}

/**
 * hreflang alternates. Saudi ↔ UAE equivalent pages share one cluster
 * (ar-SA, en-SA, ar-AE, en-AE, x-default = Saudi Arabic) so both pages emit
 * the same set; unpaired pages keep their own two-language cluster.
 */
export function buildHreflangAlternates(path: string, region: MarketingRegion) {
  const counterpart = counterpartPath(path)
  const paths: Partial<Record<MarketingRegion, string>> = { [region]: path }
  if (counterpart !== null) paths[region === 'sa' ? 'ae' : 'sa'] = counterpart
  const alternates: Array<{ rel: string; hrefLang: string; href: string }> = []
  for (const r of ['sa', 'ae'] as const) {
    const p = paths[r]
    if (p === undefined) continue
    const ar = `${SITE_URL}${p}`
    alternates.push(
      { rel: 'alternate', hrefLang: REGION_LOCALES[r].hreflangAr, href: ar },
      { rel: 'alternate', hrefLang: REGION_LOCALES[r].hreflangEn, href: withEnglish(ar) },
    )
  }
  alternates.push({ rel: 'alternate', hrefLang: 'x-default', href: alternates[0].href })
  return alternates
}

export function buildMarketingHead({
  title,
  description,
  path = '',
  lang,
  region = 'sa',
  noindex = false,
}: SeoMeta) {
  const locales = REGION_LOCALES[region]
  const arUrl = `${SITE_URL}${path}`
  const enUrl = withEnglish(arUrl)
  // Each language version is its own canonical; hreflang links the pair.
  const url = lang === 'en' ? enUrl : arUrl
  const ogLocale = lang === 'ar' ? locales.ogLocaleAr : locales.ogLocaleEn

  if (noindex || isPrivatePath(path)) {
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      links: [] as Array<Record<string, string>>,
    }
  }

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: ogLocale },
      { property: 'og:site_name', content: 'Qaftr | قافتر' },
      { property: 'og:image', content: OG_IMAGE_URL },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: locales.imageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [
      { rel: 'canonical', href: url },
      ...buildHreflangAlternates(path, region),
    ] as Array<{ rel: string; href: string; hrefLang?: string }>,
  }
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Qaftr',
    alternateName: 'قافتر',
    url: SITE_URL,
    logo: `${SITE_URL}/logo512.png`,
    email: SUPPORT_EMAIL,
    sameAs: [SITE_URL],
  }
}

/** Site-wide WebSite schema. Region-neutral: the site serves Saudi Arabia and the UAE. */
export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Qaftr',
    alternateName: 'قافتر',
    url: SITE_URL,
    inLanguage: ['ar', 'en'],
  }
}

/** Site-wide WebApplication schema covering the Saudi and UAE offerings. */
export function buildWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Qaftr',
    alternateName: 'قافتر',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    inLanguage: ['ar', 'en'],
    areaServed: [
      { '@type': 'Country', name: 'Saudi Arabia' },
      { '@type': 'Country', name: 'United Arab Emirates' },
    ],
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'SAR', category: 'Free' },
      { '@type': 'Offer', price: '0', priceCurrency: 'AED', category: 'Free' },
    ],
    featureList: [
      'ZATCA Phase 1 QR invoice generation (Saudi Arabia)',
      'Saudi 15% VAT calculation',
      'UAE 5% VAT calculator in AED',
      'UAE TRN format checker',
      'UAE e-invoicing readiness checker',
      'PDF invoice export',
      'Arabic and English invoices',
      'Client and invoice management',
    ],
  }
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; path: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  }
}

export function buildJsonLdScript(schema: unknown) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(schema),
  }
}
