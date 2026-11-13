import type { MarketingLang } from '#/lib/marketing/lang'

/**
 * Self-hosted web fonts (public/fonts, @font-face in styles.css). Preload only
 * the two files the first paint needs: body text (IBM Plex Sans Arabic 400)
 * and headings (Noto Kufi Arabic, variable), in the page's script. Other
 * weights load on demand through unicode-range.
 */
const CRITICAL = {
  ar: [
    '/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2',
    '/fonts/noto-kufi-arabic-arabic-wght-normal.woff2',
  ],
  en: [
    '/fonts/ibm-plex-sans-arabic-latin-400-normal.woff2',
    '/fonts/noto-kufi-arabic-latin-wght-normal.woff2',
  ],
} as const

export function fontPreloadLinks(lang: MarketingLang) {
  return CRITICAL[lang].map((href) => ({
    rel: 'preload',
    as: 'font',
    type: 'font/woff2',
    href,
    crossOrigin: 'anonymous' as const,
  }))
}
