import type { MarketingLang } from '#/lib/marketing/lang'
import {
  buildBreadcrumbSchema,
  buildJsonLdScript,
  buildMarketingHead,
} from '#/lib/marketing/seo'
import { buildFaqSchema } from '#/components/tools/ToolFaqSection'
import { getToolsCopy } from '#/lib/tools/copy'
import { OG_IMAGE_URL, SITE_URL } from '#/lib/marketing/constants'
import { getWaveCopy } from './wave-copy'
import {
  WAVE_GUIDE_DATE_MODIFIED,
  WAVE_GUIDE_DATE_PUBLISHED,
  getWaveGuide,
} from './wave-guide-content'

export const SA_PAGE_PATHS = {
  'zatca-wave-checker': '/tools/zatca-wave-checker',
  'zatca-wave-25': '/guides/zatca-wave-25',
} as const

export type SaPageId = keyof typeof SA_PAGE_PATHS

const withLang = (path: string, lang: MarketingLang) => `${path}${lang === 'en' ? '?lang=en' : ''}`

function getSaPage(id: SaPageId, lang: MarketingLang) {
  const brand = lang === 'ar' ? 'قافتر' : 'Qaftr'
  switch (id) {
    case 'zatca-wave-checker': {
      const copy = getWaveCopy(lang)
      return {
        seo: copy.seo,
        crumbs: [
          { name: brand, path: '/' },
          { name: getToolsCopy(lang).breadcrumbRoot, path: '/tools' },
          { name: copy.pageName, path: SA_PAGE_PATHS[id] },
        ],
        schemas: [buildFaqSchema(copy.faq)] as unknown[],
      }
    }
    case 'zatca-wave-25': {
      const guide = getWaveGuide(lang)
      const seo = guide.seo
      return {
        seo,
        crumbs: [
          { name: brand, path: '/' },
          { name: guide.title, path: SA_PAGE_PATHS[id] },
        ],
        schemas: [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: guide.title,
            description: seo.description,
            inLanguage: lang === 'ar' ? 'ar-SA' : 'en',
            datePublished: WAVE_GUIDE_DATE_PUBLISHED,
            dateModified: WAVE_GUIDE_DATE_MODIFIED,
            mainEntityOfPage: `${SITE_URL}${withLang(SA_PAGE_PATHS[id], lang)}`,
            image: OG_IMAGE_URL,
            author: { '@type': 'Organization', name: 'Qaftr', url: SITE_URL },
            publisher: {
              '@type': 'Organization',
              name: 'Qaftr',
              logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo512.png` },
            },
          },
          buildFaqSchema(guide.faq),
        ] as unknown[],
      }
    }
  }
}

/** Full <head> for a Saudi content page: SEO tags (ar-SA/en) plus JSON-LD, breadcrumb first. */
export function buildSaPageHead(id: SaPageId, lang: MarketingLang) {
  const page = getSaPage(id, lang)
  const breadcrumb = buildBreadcrumbSchema(
    page.crumbs.map((c) => ({ name: c.name, path: withLang(c.path, lang) })),
  )
  return {
    ...buildMarketingHead({ ...page.seo, path: SA_PAGE_PATHS[id], lang, region: 'sa' }),
    scripts: [breadcrumb, ...page.schemas].map(buildJsonLdScript),
  }
}
