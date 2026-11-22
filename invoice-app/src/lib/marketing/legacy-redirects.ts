import { redirect } from '@tanstack/react-router'
import { resolveLang } from './lang'
import type { MarketingSearch } from './lang'

/**
 * Landing pages merged into the tax invoice tool (docs/MARKET_SEO_AUDIT_2026-11-08.md S5):
 * they all targeted "invoice generator" and sent visitors to the same tool.
 * Their URLs stay alive as permanent redirects so links and rankings carry over.
 */
export const LEGACY_LANDING_PATHS = [
  '/free-invoice-generator',
  '/invoice-generator-saudi-arabia',
  '/vat-invoice-generator-saudi-arabia',
] as const

const TARGET = '/tools/fatora'

/** Throws a 301 redirect to the tax invoice tool, keeping the English language. */
export function legacyLandingRedirect(search: MarketingSearch): never {
  const href = resolveLang(search) === 'en' ? `${TARGET}?lang=en` : TARGET
  throw redirect({ href, statusCode: 301 })
}
