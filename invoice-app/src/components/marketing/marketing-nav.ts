import type { MarketingLang } from '#/lib/marketing/lang'
import { t } from '#/lib/marketing/i18n'

export type MarketingNavItem = {
  to: '/tools' | '/guides' | '/' | '/support'
  hash?: 'features' | 'pricing'
  label: string
}

/**
 * Header destinations, shared by the desktop nav and the mobile menu.
 * No UAE item: the region picker next to the nav already switches country.
 */
export function getMarketingNavItems(lang: MarketingLang): MarketingNavItem[] {
  const copy = t(lang)
  const ar = lang === 'ar'
  return [
    { to: '/tools', label: ar ? 'أدوات مجانية' : 'Free tools' },
    { to: '/guides', label: ar ? 'الأدلة' : 'Guides' },
    { to: '/', hash: 'features', label: copy.nav.features },
    { to: '/', hash: 'pricing', label: copy.nav.pricing },
    { to: '/support', label: copy.nav.support },
  ]
}
