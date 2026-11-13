import { regionFromPath } from '#/lib/marketing/lang'
import type { MarketingLang, MarketingRegion } from '#/lib/marketing/lang'
import { analyticsActive } from './consent'

/**
 * GA4 events. Params are categories and counts only: never names, emails,
 * TRNs, VAT numbers, invoice numbers or amounts. `region` and `lang` are added
 * to every event from the current URL. See docs/ANALYTICS.md.
 */
export type ToolName =
  | 'vat_calculator'
  | 'trn_checker'
  | 'zatca_wave_checker'
  | 'zatca_qr_decoder'
  | 'uae_vat_calculator'
  | 'uae_trn_checker'
  | 'uae_readiness_quiz'

/** Free Saudi document generators (receipt voucher, quotation, credit note). */
export const DOCUMENT_TOOLS = ['receipt_voucher', 'quotation', 'credit_note', 'non_tax_invoice'] as const
export type DocumentToolName = (typeof DOCUMENT_TOOLS)[number]

export type InvoiceToolName = 'fatora' | 'home_instant' | 'workspace' | 'uae_invoice_generator'

export type AnalyticsEvents = {
  invoice_pdf_download: {
    tool: InvoiceToolName
    invoice_type?: 'simplified' | 'full'
    line_count?: number
    currency?: 'SAR' | 'AED'
  }
  document_pdf_download: {
    tool: DocumentToolName
    output_lang: 'ar' | 'en' | 'bilingual'
    currency: 'SAR'
    line_count?: number
    /** receipt voucher only */
    payment_method?: 'cash' | 'bank_transfer' | 'cheque' | 'card'
    /** credit note only (Article 40(1) case, never free text) */
    reason?: string
  }
  invoice_save_click: { tool: InvoiceToolName; signed_in: boolean }
  sign_up: { method: 'email'; source: 'invoice' | 'general' }
  tool_used: { tool: ToolName; result?: string }
  cta_click: { cta: string; cta_location: string }
  region_switch: { from: MarketingRegion; to: MarketingRegion }
  language_switch: { from: MarketingLang; to: MarketingLang }
}

export type AnalyticsEventName = keyof AnalyticsEvents

export type EventContext = { region: MarketingRegion; lang: MarketingLang }

type Primitive = string | number | boolean

export function contextFromLocation(loc: { pathname: string; search: string }): EventContext {
  let lang: MarketingLang = 'ar'
  try {
    const raw = new URLSearchParams(loc.search).get('lang')
    if (raw && raw.trim().toLowerCase() === 'en') lang = 'en'
  } catch {
    // keep default
  }
  return { region: regionFromPath(loc.pathname), lang }
}

const PII_KEY_RE = /email|name|phone|trn|vat_?number|address|password/i
const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/
const LONG_DIGITS_RE = /\d{9,}/
const MAX_STRING = 100

export function buildEventParams(
  params: Record<string, unknown>,
  ctx: EventContext,
): Record<string, Primitive> {
  const out: Record<string, Primitive> = {}
  for (const [key, value] of Object.entries(params)) {
    if (PII_KEY_RE.test(key)) continue
    if (typeof value === 'number') {
      if (Number.isFinite(value)) out[key] = value
    } else if (typeof value === 'boolean') {
      out[key] = value
    } else if (typeof value === 'string') {
      if (EMAIL_RE.test(value) || LONG_DIGITS_RE.test(value)) continue
      out[key] = value.slice(0, MAX_STRING)
    }
  }
  out.region = ctx.region
  out.lang = ctx.lang
  return out
}

/** Sends a GA4 event. No-op when GA is not loaded; never throws. */
export function track<TEvent extends AnalyticsEventName>(
  event: TEvent,
  params: AnalyticsEvents[TEvent],
) {
  try {
    if (!analyticsActive()) return
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
    if (typeof gtag !== 'function') return
    const ctx = contextFromLocation(window.location)
    gtag('event', event, buildEventParams(params, ctx))
  } catch {
    // analytics must never break the page
  }
}
