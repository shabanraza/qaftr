import {
  OG_IMAGE_URL,
  SITE_URL,
  SEO_KEYWORDS,
  SUPPORT_EMAIL,
} from './constants'
import type { MarketingLang } from './lang'

type SeoMeta = {
  title: string
  description: string
  path?: string
  lang: MarketingLang
}

export function buildMarketingHead({
  title,
  description,
  path = '',
  lang,
}: SeoMeta) {
  const url = `${SITE_URL}${path}`
  const arUrl = url
  const enUrl = `${url}${url.includes('?') ? '&' : '?'}lang=en`
  const keywords = SEO_KEYWORDS.join(', ')
  const ogLocale = lang === 'ar' ? 'ar_SA' : 'en_US'

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
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
      {
        property: 'og:image:alt',
        content:
          'Qaftr | قافتر — ZATCA Phase 1 invoicing for Saudi freelancers',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [
      { rel: 'canonical', href: url },
      { rel: 'alternate', hrefLang: 'ar-SA', href: arUrl },
      { rel: 'alternate', hrefLang: 'en', href: enUrl },
      { rel: 'alternate', hrefLang: 'x-default', href: arUrl },
    ],
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

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Qaftr',
    alternateName: 'قافتر',
    url: SITE_URL,
    inLanguage: ['ar-SA', 'en'],
  }
}

export function buildWebApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Qaftr',
    alternateName: 'قافتر',
    url: SITE_URL,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'SAR',
      category: 'Free',
    },
    featureList: [
      'ZATCA Phase 1 QR invoice generation',
      'Saudi 15% VAT calculation',
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
