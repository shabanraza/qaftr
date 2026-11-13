import type { MarketingLang } from '#/lib/marketing/lang'

const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]
const MONTHS_EN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats an ISO day (YYYY-MM-DD) as "1 Jul 2027" / "1 يوليو 2027".
 * Done by hand (not Intl) so SSR on Workers and the browser render the same
 * string and hydration never mismatches.
 */
export function formatAeDate(iso: string, lang: MarketingLang): string {
  const [year, month, day] = iso.split('-').map(Number)
  const months = lang === 'ar' ? MONTHS_AR : MONTHS_EN
  return `${day} ${months[month - 1]} ${year}`
}

/** "1,050.00 AED" / "1,050.00 درهم" with Latin digits, as commonly used on UAE invoices. */
export function formatAed(value: string | number, lang: MarketingLang): string {
  const amount = typeof value === 'number' ? value : parseFloat(value)
  if (Number.isNaN(amount)) return String(value)
  const [whole, fraction] = amount.toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${grouped}.${fraction} ${lang === 'ar' ? 'درهم' : 'AED'}`
}

/** Today's calendar day in the UAE (UTC+4, no DST) as YYYY-MM-DD. */
export function todayInUae(now: Date = new Date()): string {
  return new Date(now.getTime() + 4 * 3_600_000).toISOString().slice(0, 10)
}

/** Search params for internal links: Arabic is the clean URL. */
export function langSearch(lang: MarketingLang) {
  return lang === 'en' ? { lang: 'en' as const } : {}
}

/**
 * Parses an amount typed by a user: "1,050.5", "١٬٠٥٠٫٥" or " 2 000 ".
 * Returns NaN for anything that is not a plain number.
 */
export function parseAmountInput(raw: string): number {
  const ascii = raw
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[,\s\u066c]/g, '')
    .replace(/\u066b/g, '.')
  return /^-?(\d+\.?\d*|\.\d+)$/.test(ascii) ? Number(ascii) : Number.NaN
}
