import type { MarketingLang } from '#/lib/marketing/lang'
import { formatAeDate } from '#/lib/ae/format'

/** Saudi Arabic copy uses Arabic-Indic digits (١٥٪); invoice amounts are out of scope. */
export function toArabicIndic(text: string): string {
  return text
    .replace(/(\d),(?=\d{3})/g, '$1٬')
    .replace(/(\d)\.(?=\d)/g, '$1٫')
    .replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)))
}

export function formatSaNumber(value: number, lang: MarketingLang): string {
  const sign = value < 0 ? '-' : ''
  const grouped = String(Math.abs(Math.round(value))).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return sign + (lang === 'ar' ? toArabicIndic(grouped) : grouped)
}

/** "1 Feb 2027" / "١ فبراير ٢٠٢٧" — formatted by hand so SSR and client match. */
export function formatSaDate(iso: string, lang: MarketingLang): string {
  const date = formatAeDate(iso, lang)
  return lang === 'ar' ? toArabicIndic(date) : date
}

/** Today's calendar day in Saudi Arabia (UTC+3, no DST) as YYYY-MM-DD. */
export function todayInSaudi(now: Date = new Date()): string {
  return new Date(now.getTime() + 3 * 3_600_000).toISOString().slice(0, 10)
}
