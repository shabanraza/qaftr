import type { MarketingLang } from '#/lib/marketing/lang'
import {
  buildBreadcrumbSchema,
  buildJsonLdScript,
  buildMarketingHead,
} from '#/lib/marketing/seo'
import { buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { OG_IMAGE_URL, SITE_URL } from '#/lib/marketing/constants'
import { getAeCopy } from './copy'
import { getAeInvoiceCopy } from './invoice-copy'
import {
  AE_GUIDE_DATE_MODIFIED,
  AE_GUIDE_DATE_PUBLISHED,
  getAeGuide,
} from './guide-content'

export const AE_PAGE_PATHS = {
  hub: '/ae',
  'trn-checker': '/ae/tools/trn-checker',
  'vat-calculator': '/ae/tools/vat-calculator',
  'e-invoicing-readiness': '/ae/tools/e-invoicing-readiness',
  'invoice-generator': '/ae/tools/invoice-generator',
  guide: '/ae/guides/uae-e-invoicing-2027',
} as const

export type AePageId = keyof typeof AE_PAGE_PATHS

/** Order of the cards on the /ae hub. */
export const AE_HUB_CARD_IDS = [
  'e-invoicing-readiness',
  'invoice-generator',
  'trn-checker',
  'vat-calculator',
  'guide',
] as const satisfies readonly AePageId[]

/** Page-specific JSON-LD (after the breadcrumb). */
export function getAePageSchemas(id: AePageId, lang: MarketingLang): unknown[] {
  const copy = getAeCopy(lang)
  switch (id) {
    case 'trn-checker':
      return [buildFaqSchema(copy.trn.faq)]
    case 'vat-calculator':
      return [buildFaqSchema(copy.vat.faq)]
    case 'e-invoicing-readiness':
      return [buildFaqSchema(copy.readiness.faq)]
    case 'invoice-generator': {
      const inv = getAeInvoiceCopy(lang)
      return [
        buildFaqSchema(inv.faq),
        {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: inv.howTo.name,
          inLanguage: lang === 'ar' ? 'ar-AE' : 'en-AE',
          totalTime: 'PT3M',
          estimatedCost: { '@type': 'MonetaryAmount', currency: 'AED', value: '0' },
          step: inv.howTo.steps.map((step, i) => ({
            '@type': 'HowToStep',
            position: i + 1,
            name: step.name,
            text: step.text,
          })),
        },
      ]
    }
    case 'guide': {
      const guide = getAeGuide(lang)
      const url = `${SITE_URL}${AE_PAGE_PATHS.guide}${lang === 'en' ? '?lang=en' : ''}`
      return [
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: copy.seo.guide.description,
          inLanguage: lang === 'ar' ? 'ar-AE' : 'en-AE',
          datePublished: AE_GUIDE_DATE_PUBLISHED,
          dateModified: AE_GUIDE_DATE_MODIFIED,
          mainEntityOfPage: url,
          image: OG_IMAGE_URL,
          author: { '@type': 'Organization', name: 'Qaftr', url: SITE_URL },
          publisher: {
            '@type': 'Organization',
            name: 'Qaftr',
            logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo512.png` },
          },
        },
        buildFaqSchema(guide.faq),
      ]
    }
    default:
      return []
  }
}

/** Full <head> for a UAE page: region-aware SEO tags plus JSON-LD (breadcrumb first). */
export function buildAePageHead(
  id: AePageId,
  lang: MarketingLang,
  schemas: unknown[] = getAePageSchemas(id, lang),
) {
  const copy = getAeCopy(lang)
  const path = AE_PAGE_PATHS[id]
  const crumbs = [
    { name: copy.brand, path: '/' },
    { name: copy.pageNames.hub, path: AE_PAGE_PATHS.hub },
  ]
  if (id !== 'hub') crumbs.push({ name: copy.pageNames[id], path })
  const suffix = lang === 'en' ? '?lang=en' : ''
  const breadcrumb = buildBreadcrumbSchema(
    crumbs.map((c) => ({ name: c.name, path: `${c.path}${suffix}` })),
  )

  return {
    ...buildMarketingHead({ ...copy.seo[id], path, lang, region: 'ae' }),
    scripts: [breadcrumb, ...schemas].map(buildJsonLdScript),
  }
}
