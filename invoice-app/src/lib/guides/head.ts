import { buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { OG_IMAGE_URL, SITE_URL } from '#/lib/marketing/constants'
import type { MarketingLang } from '#/lib/marketing/lang'
import { buildBreadcrumbSchema, buildJsonLdScript, buildMarketingHead } from '#/lib/marketing/seo'
import { GUIDES_DATE_MODIFIED, GUIDES_DATE_PUBLISHED, getGuide, getGuideList, getGuidesHub } from './content'
import type { GuideSlug } from './content'

const withLang = (path: string, lang: MarketingLang) => `${path}${lang === 'en' ? '?lang=en' : ''}`
const brand = (lang: MarketingLang) => (lang === 'ar' ? 'قافتر' : 'Qaftr')

/** <head> for /guides/<slug>: SEO tags plus Breadcrumb, Article and FAQPage JSON-LD. */
export function buildGuideHead(slug: GuideSlug, lang: MarketingLang) {
  const guide = getGuide(slug, lang)
  const hub = getGuidesHub(lang)
  const path = `/guides/${slug}`
  const schemas: unknown[] = [
    buildBreadcrumbSchema([
      { name: brand(lang), path: withLang('/', lang) },
      { name: hub.breadcrumb, path: withLang('/guides', lang) },
      { name: guide.breadcrumb, path: withLang(path, lang) },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.seo.description,
      inLanguage: lang === 'ar' ? 'ar-SA' : 'en',
      datePublished: GUIDES_DATE_PUBLISHED,
      dateModified: GUIDES_DATE_MODIFIED,
      mainEntityOfPage: `${SITE_URL}${withLang(path, lang)}`,
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
  return {
    ...buildMarketingHead({ ...guide.seo, path, lang, region: 'sa' }),
    scripts: schemas.map(buildJsonLdScript),
  }
}

/** <head> for the /guides hub: SEO tags plus Breadcrumb and ItemList JSON-LD. */
export function buildGuidesHubHead(lang: MarketingLang) {
  const hub = getGuidesHub(lang)
  const schemas: unknown[] = [
    buildBreadcrumbSchema([
      { name: brand(lang), path: withLang('/', lang) },
      { name: hub.breadcrumb, path: withLang('/guides', lang) },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: getGuideList(lang).map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        url: `${SITE_URL}${withLang(g.href, lang)}`,
      })),
    },
  ]
  return {
    ...buildMarketingHead({ ...hub.seo, path: '/guides', lang, region: 'sa' }),
    scripts: schemas.map(buildJsonLdScript),
  }
}
