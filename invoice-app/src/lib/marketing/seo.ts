import { OG_IMAGE_URL, SITE_URL, SEO_KEYWORDS } from './constants'
import type { MarketingLang } from './lang'

type SeoMeta = {
  title: string
  description: string
  path?: string
  lang: MarketingLang
}

export function buildMarketingHead({ title, description, path = '', lang }: SeoMeta) {
  const url = `${SITE_URL}${path}`
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
      { property: 'og:image:alt', content: 'Qaftr | قافتر — ZATCA Phase 1 invoicing for Saudi freelancers' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: OG_IMAGE_URL },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
