import { z } from 'zod'

export type MarketingLang = 'ar' | 'en'

/**
 * `?lang=` is user-controlled: accept "en"/"ar" in any case and silently
 * drop anything else (fr, empty, ?lang=a&lang=b) instead of a 500.
 */
export const marketingSearchSchema = z.object({
  lang: z
    .preprocess(
      (raw) => {
        const value: unknown = Array.isArray(raw) ? raw[0] : raw
        return typeof value === 'string' ? value.trim().toLowerCase() : value
      },
      z.enum(['ar', 'en']).optional(),
    )
    .catch(undefined),
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

export type MarketingRegion = 'sa' | 'ae'

/** UAE pages live under /ae; everything else is the Saudi (default) site. */
export function regionFromPath(pathname: string): MarketingRegion {
  return pathname === '/ae' || pathname.startsWith('/ae/') ? 'ae' : 'sa'
}

/** Value for <html lang>. Saudi English stays plain `en` (unchanged behaviour). */
export function htmlLangAttr(
  lang: MarketingLang,
  region: MarketingRegion,
): string {
  if (region === 'ae') return lang === 'ar' ? 'ar-AE' : 'en-AE'
  return lang === 'ar' ? 'ar-SA' : 'en'
}
