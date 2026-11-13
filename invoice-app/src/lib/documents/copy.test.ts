import { describe, expect, it } from 'vitest'
import { DOCUMENT_KINDS, getDocumentCopy } from './copy'

const LANGS = ['ar', 'en'] as const

function collect(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (typeof v === 'function') out.push(String((v as (n: number, m: string) => string)(3, 'x')))
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, out))
  return out
}

describe('document generator copy', () => {
  it('has SEO within limits, unique per page and language', () => {
    const titles = new Set<string>()
    const descriptions = new Set<string>()
    for (const lang of LANGS) {
      for (const kind of DOCUMENT_KINDS) {
        const { seo } = getDocumentCopy(lang)[kind]
        expect(seo.title.length, seo.title).toBeLessThanOrEqual(60)
        expect(seo.description.length, seo.description).toBeLessThanOrEqual(155)
        titles.add(seo.title)
        descriptions.add(seo.description)
      }
    }
    expect(titles.size).toBe(6)
    expect(descriptions.size).toBe(6)
  })

  it('puts the Arabic keyword first in Arabic titles', () => {
    const ar = getDocumentCopy('ar')
    expect(ar['receipt-voucher'].seo.title.startsWith('سند قبض')).toBe(true)
    expect(ar.quotation.seo.title.startsWith('عرض سعر')).toBe(true)
    expect(ar['credit-note'].seo.title.startsWith('إشعار دائن')).toBe(true)
  })

  it('titles documents with the regime terms', () => {
    const ar = getDocumentCopy('ar')
    const en = getDocumentCopy('en')
    expect(ar['credit-note'].title).toContain('إشعار دائن')
    expect(en['credit-note'].title).toContain('Credit Note')
    expect(ar['receipt-voucher'].title).toContain('سند قبض')
    expect(ar.quotation.title).toContain('عرض سعر')
    // a receipt voucher is not a tax invoice; a credit note must reference one
    expect(ar['receipt-voucher'].notTaxInvoice).toContain('ليس فاتورة ضريبية')
    expect(en['receipt-voucher'].notTaxInvoice).toMatch(/not a tax invoice/i)
    expect(ar['credit-note'].linkedNote).toContain('الفاتورة الضريبية')
    expect(en['credit-note'].linkedNote).toMatch(/original tax invoice/i)
  })

  it('uses Arabic-Indic digits in Saudi Arabic copy', () => {
    const strings = collect(getDocumentCopy('ar'))
    expect(strings.filter((s) => /[؀-ۿ]/.test(s) && /[0-9]/.test(s))).toEqual([])
  })

  it('has FAQ and HowTo content for each tool', () => {
    for (const lang of LANGS) {
      for (const kind of DOCUMENT_KINDS) {
        const c = getDocumentCopy(lang)[kind]
        expect(c.faq.length).toBeGreaterThanOrEqual(3)
        expect(c.howTo.steps.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('makes no forbidden trust claims and addresses businesses', () => {
    const all = collect([getDocumentCopy('ar'), getDocumentCopy('en')]).join(' ')
    expect(all).not.toMatch(/معتمد من|ZATCA[- ]approved|FTA accredited|الهيئة العامة للزكاة/)
  })
})
