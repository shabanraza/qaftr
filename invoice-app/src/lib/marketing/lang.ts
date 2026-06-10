import { z } from 'zod'

export type MarketingLang = 'ar' | 'en'

export const marketingSearchSchema = z.object({
  lang: z.enum(['ar', 'en']).optional(),
})

export type MarketingSearch = z.infer<typeof marketingSearchSchema>

export function resolveLang(search?: MarketingSearch | null): MarketingLang {
  if (search?.lang === 'en') return 'en'
  return 'ar'
}

export function toggleLang(current: MarketingLang): MarketingSearch {
  return current === 'ar' ? { lang: 'en' } : { lang: 'ar' }
}

export function langDir(lang: MarketingLang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}
