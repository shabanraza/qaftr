import { z } from 'zod'

export type MarketingLang = 'ar' | 'en'

export const marketingSearchSchema = z.object({
  lang: z.enum(['en']).optional(),
})

export type MarketingSearch = z.infer<typeof marketingSearchSchema>

export function resolveLang(search?: MarketingSearch | null): MarketingLang {
  return search?.lang === 'en' ? 'en' : 'ar'
}

export function langDir(lang: MarketingLang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}

export function toggleLang(current: MarketingLang): MarketingSearch {
  return current === 'ar' ? { lang: 'en' } : {}
}
