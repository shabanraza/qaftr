import { SITE_URL, SEO_KEYWORDS } from './constants'
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
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
