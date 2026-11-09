import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DOCUMENT_TOOLS, buildEventParams, contextFromLocation, track } from './track'

type W = typeof window & {
  gtag?: (...args: unknown[]) => void
  __qaftrAnalytics?: boolean
}

describe('contextFromLocation', () => {
  it('derives region and lang from the URL', () => {
    expect(contextFromLocation({ pathname: '/', search: '' })).toEqual({ region: 'sa', lang: 'ar' })
    expect(contextFromLocation({ pathname: '/tools/fatora', search: '?lang=en' })).toEqual({ region: 'sa', lang: 'en' })
    expect(contextFromLocation({ pathname: '/ae/tools/vat-calculator', search: '?lang=EN' })).toEqual({ region: 'ae', lang: 'en' })
    expect(contextFromLocation({ pathname: '/ae', search: '?lang=fr' })).toEqual({ region: 'ae', lang: 'ar' })
  })
})

describe('buildEventParams', () => {
  const ctx = { region: 'ae' as const, lang: 'en' as const }

  it('adds region and lang to every event', () => {
    expect(buildEventParams({ tool: 'vat_calculator' }, ctx)).toEqual({
      tool: 'vat_calculator',
      region: 'ae',
      lang: 'en',
    })
  })

  it('keeps only primitive values and drops anything that looks like PII', () => {
    const params = buildEventParams(
      {
        line_count: 3,
        currency: 'AED',
        email: 'a@b.co',
        note: 'mail me at someone@example.com',
        trn: '100123456789003',
        nested: { a: 1 },
        nothing: undefined,
        ok: true,
        nan: Number.NaN,
      },
      ctx,
    )
    expect(params).toEqual({ line_count: 3, currency: 'AED', ok: true, region: 'ae', lang: 'en' })
  })

  it('caps long strings', () => {
    const params = buildEventParams({ cta: 'x'.repeat(300) }, ctx)
    expect(String(params.cta).length).toBe(100)
  })
})

describe('track', () => {
  const w = window as W
  beforeEach(() => {
    window.history.replaceState(null, '', '/ae/tools/trn-checker?lang=en')
  })
  afterEach(() => {
    delete w.gtag
    delete w.__qaftrAnalytics
    window.history.replaceState(null, '', '/')
  })

  it('is a no-op when GA is absent', () => {
    expect(() => track('tool_used', { tool: 'uae_trn_checker' })).not.toThrow()
  })

  it('does not call gtag unless the bootstrap ran', () => {
    w.gtag = vi.fn()
    track('tool_used', { tool: 'uae_trn_checker' })
    expect(w.gtag).not.toHaveBeenCalled()
  })

  it('sends the event with region and lang', () => {
    w.gtag = vi.fn()
    w.__qaftrAnalytics = true
    track('invoice_pdf_download', { tool: 'uae_invoice_generator', line_count: 2, currency: 'AED', invoice_type: 'full' })
    expect(w.gtag).toHaveBeenCalledWith('event', 'invoice_pdf_download', {
      tool: 'uae_invoice_generator',
      line_count: 2,
      currency: 'AED',
      invoice_type: 'full',
      region: 'ae',
      lang: 'en',
    })
  })

  it('sends document_pdf_download for the Saudi document generators', () => {
    expect(DOCUMENT_TOOLS).toEqual(['receipt_voucher', 'quotation', 'credit_note'])
    w.gtag = vi.fn()
    w.__qaftrAnalytics = true
    window.history.replaceState(null, '', '/tools/receipt-voucher')
    track('document_pdf_download', { tool: 'receipt_voucher', output_lang: 'bilingual', currency: 'SAR' })
    expect(w.gtag).toHaveBeenCalledWith('event', 'document_pdf_download', {
      tool: 'receipt_voucher',
      output_lang: 'bilingual',
      currency: 'SAR',
      region: 'sa',
      lang: 'ar',
    })
  })

  it('never throws when gtag throws', () => {
    w.gtag = () => {
      throw new Error('boom')
    }
    w.__qaftrAnalytics = true
    expect(() => track('sign_up', { method: 'email', source: 'general' })).not.toThrow()
  })
})
