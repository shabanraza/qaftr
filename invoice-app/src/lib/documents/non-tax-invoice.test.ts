import { describe, expect, it } from 'vitest'
import { getDocumentCopy } from './copy'
import { buildNonTaxInvoiceHtml } from './document-html'
import { DOCUMENT_DRAFT_KEYS, createEmptyNonTaxInvoiceDraft, parseNonTaxInvoiceDraft } from './draft'
import type { DocumentOutputLang, NonTaxInvoiceDraft } from './draft'
import { buildDocumentPageHead } from './pages'

function draft(outputLang: DocumentOutputLang, patch: Partial<NonTaxInvoiceDraft> = {}): NonTaxInvoiceDraft {
  return {
    ...createEmptyNonTaxInvoiceDraft('2026-11-13', outputLang),
    seller: { name: 'مؤسسة النخبة للصيانة', address: 'جدة', crNumber: '4030123456' },
    buyer: { name: 'محمد العتيبي', address: '' },
    lines: [
      { description: 'صيانة <b>مكيف</b>', qty: '2', unitPrice: '150' },
      { description: 'قطع غيار', qty: '1', unitPrice: '99.5' },
    ],
    notes: 'الضمان ٣٠ يوماً',
    ...patch,
  }
}

const textOf = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''

describe('non-tax invoice copy', () => {
  it('targets the Arabic keyword and says no VAT is charged', () => {
    const ar = getDocumentCopy('ar')['non-tax-invoice']
    const en = getDocumentCopy('en')['non-tax-invoice']
    expect(ar.seo.title.startsWith('فاتورة غير ضريبية')).toBe(true)
    expect(ar.title).toContain('فاتورة غير ضريبية')
    expect(en.title).toMatch(/non-tax invoice/i)
    expect(ar.notRegisteredNote).toContain('غير مسجلة')
    expect(en.notRegisteredNote).toMatch(/not registered for VAT/i)
  })

  it('states the ZATCA prohibition as written: no VAT amount, no VAT collection, fine up to SAR 100,000', () => {
    const ar = getDocumentCopy('ar')['non-tax-invoice'].faq[2].answer
    const en = getDocumentCopy('en')['non-tax-invoice'].faq[2].answer
    expect(en).toMatch(/SAR 100,000/)
    expect(en).toMatch(/collect VAT/)
    expect(en).not.toMatch(/VAT number/)
    expect(ar).toContain('١٠٠٬٠٠٠')
    expect(ar).not.toContain('رقم ضريبي')
  })

  it('tells VAT-registered businesses to issue a tax invoice instead', () => {
    expect(getDocumentCopy('ar')['non-tax-invoice'].registeredWarning).toContain('فاتورة ضريبية')
    expect(getDocumentCopy('en')['non-tax-invoice'].registeredWarning).toMatch(/tax invoice/i)
  })
})

describe('non-tax invoice draft', () => {
  it('has its own versioned key and an INV default number', () => {
    expect(DOCUMENT_DRAFT_KEYS['non-tax-invoice']).toBe('qaftr:non-tax-invoice-draft:v1')
    expect(createEmptyNonTaxInvoiceDraft('2026-11-13', 'en')).toMatchObject({
      outputLang: 'en',
      number: 'INV-0001',
      date: '2026-11-13',
      seller: { name: '', address: '', crNumber: '' },
      buyer: { name: '', address: '' },
      notes: '',
    })
  })

  it('parses stored drafts defensively and drops unknown fields such as a VAT number', () => {
    const parsed = parseNonTaxInvoiceDraft(
      JSON.stringify({
        outputLang: 'xx',
        number: 'INV-7',
        seller: { name: 'A', crNumber: 5, vatNumber: '300000000000003' },
        lines: [{ description: 'x', qty: '1', unitPrice: '10' }],
      }),
    )
    expect(parsed).toMatchObject({ outputLang: 'ar', number: 'INV-7', seller: { name: 'A', address: '', crNumber: '' } })
    expect(JSON.stringify(parsed)).not.toContain('vatNumber')
    expect(parseNonTaxInvoiceDraft('not json')).toBeNull()
    expect(parseNonTaxInvoiceDraft(JSON.stringify({ number: 'x' }))).toBeNull()
  })
})

describe('buildNonTaxInvoiceHtml', () => {
  it('prints an Arabic non-tax invoice with no VAT anywhere', () => {
    const html = buildNonTaxInvoiceHtml(draft('ar'))
    const t = textOf(html)
    expect(html).toContain('<html lang="ar" dir="rtl">')
    expect(t).toContain('فاتورة غير ضريبية')
    expect(t).toContain('مؤسسة النخبة للصيانة')
    expect(t).toContain('4030123456')
    expect(t).toContain('محمد العتيبي')
    expect(t).toContain('399.50 ر.س')
    expect(t).toContain('غير مسجلة في ضريبة القيمة المضافة')
    expect(t).not.toMatch(/الرقم الضريبي|15%|ضريبة القيمة المضافة 15|شامل الضريبة|فاتورة ضريبية مبسطة/)
    expect(html).not.toContain('<b>مكيف')
  })

  it('prints English and bilingual titles', () => {
    expect(textOf(buildNonTaxInvoiceHtml(draft('en')))).toMatch(/Non-Tax Invoice[\s\S]*SAR 399\.50/)
    const bi = textOf(buildNonTaxInvoiceHtml(draft('bilingual')))
    expect(bi).toContain('فاتورة غير ضريبية')
    expect(bi).toContain('Non-Tax Invoice')
    expect(textOf(buildNonTaxInvoiceHtml(draft('en')))).not.toMatch(/VAT number|VAT 15%|incl\. VAT/)
  })

  it('omits the buyer and CR blocks when empty', () => {
    const t = textOf(
      buildNonTaxInvoiceHtml(draft('en', { buyer: { name: '', address: '' }, seller: { name: 'Shop', address: '', crNumber: '' } })),
    )
    expect(t).not.toMatch(/Bill to|CR no\./)
  })
})

describe('non-tax invoice page head', () => {
  it('uses its own canonical path', () => {
    const head = buildDocumentPageHead('non-tax-invoice', 'ar')
    expect(head.links).toContainEqual({ rel: 'canonical', href: 'https://qaftr.com/tools/non-tax-invoice' })
    expect(head.meta[0]).toEqual({ title: expect.stringMatching(/^فاتورة غير ضريبية/) })
  })
})
