import type { MarketingSearch } from '#/lib/marketing/lang'

/**
 * Where signed-out visitors to private pages (/workspace, /invoices) go:
 * the free invoice tool on the home page, keeping English if they were on it.
 */
export function buildSignedOutRedirect(search: MarketingSearch | undefined) {
  return {
    to: '/' as const,
    hash: 'invoice-tool',
    search: search?.lang === 'en' ? { lang: 'en' as const } : {},
  }
}
