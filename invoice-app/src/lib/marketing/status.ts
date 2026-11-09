import { marketingSearchSchema, resolveLang } from './lang'

/**
 * Root <head> title (and robots on 404). TanStack marks the root match with
 * `globalNotFound` when no route matches, before head() runs.
 */
export function rootHeadMeta(match: { globalNotFound?: boolean; search: unknown }) {
  if (!match.globalNotFound) return [{ title: 'Qaftr | قافتر' }]
  const parsed = marketingSearchSchema.safeParse(match.search)
  const lang = resolveLang(parsed.success ? parsed.data : {})
  return [
    { title: lang === 'en' ? 'Page not found — Qaftr' : 'الصفحة غير موجودة — قافتر' },
    { name: 'robots', content: 'noindex' },
  ]
}
