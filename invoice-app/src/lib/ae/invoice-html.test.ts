import { describe, expect, it } from 'vitest'
import { createEmptyUaeDraft } from './invoice-draft'
import type { UaeInvoiceDraft } from './invoice-draft'
import { buildUaeInvoiceHtml } from './invoice-html'

function sample(over: Partial<UaeInvoiceDraft> = {}): UaeInvoiceDraft {
  const d = createEmptyUaeDraft('2026-11-08', 'en')
  return {
    ...d,
    invoiceNumber: 'INV-0042',
    supplyDate: '2026-11-01',
    supplier: { name: 'Noor Design FZ-LLC', address: 'Dubai, UAE', trn: '100 1234 5670 0003' },
    recipient: {
      name: 'Gulf Trading LLC',
      address: 'Abu Dhabi, UAE',
      trn: '100987654300003',
      vatRegistered: true,
    },
    lines: [
      { description: 'Logo design', qty: '2', unitPrice: '500', discount: '100', vatCategory: 'standard' },
      { description: 'Export service', qty: '1', unitPrice: '200', discount: '', vatCategory: 'zero' },
      { description: 'Exempt item', qty: '1', unitPrice: '300', discount: '', vatCategory: 'exempt' },
    ],
    ...over,
  }
}

const text = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html').body.textContent

describe('buildUaeInvoiceHtml', () => {
  it('prints every FTA tax-invoice field in English with AED totals', () => {
    const html = buildUaeInvoiceHtml(sample())
    const t = text(html)
    expect(html).toContain('<html lang="en" dir="ltr">')
    for (const s of [
      'Tax Invoice',
      'Noor Design FZ-LLC',
      'Dubai, UAE',
      '100123456700003',
      'Gulf Trading LLC',
      'Abu Dhabi, UAE',
      '100987654300003',
      'INV-0042',
      '8 Nov 2026',
      '1 Nov 2026',
      'Logo design',
      '5%',
      '0%',
      'Exempt',
      '100.00',
      '1,400.00',
      '45.00',
      '1,445.00 AED',
    ]) {
      expect(t, s).toContain(s)
    }
  })

  it('has no ZATCA QR code or Saudi references', () => {
    const html = buildUaeInvoiceHtml(sample())
    expect(html).not.toMatch(/<img|qr|ZATCA|SAR|ريال/i)
  })

  it('renders Arabic right-to-left with Latin digits for amounts', () => {
    const html = buildUaeInvoiceHtml(sample({ outputLang: 'ar' }))
    const t = text(html)
    expect(html).toContain('<html lang="ar" dir="rtl">')
    expect(t).toContain('فاتورة ضريبية')
    expect(t).toContain('1,445.00 درهم')
    expect(t).not.toMatch(/[٠-٩]/)
  })

  it('renders bilingual labels side by side', () => {
    const html = buildUaeInvoiceHtml(sample({ outputLang: 'bilingual' }))
    const t = text(html)
    expect(t).toContain('فاتورة ضريبية')
    expect(t).toContain('Tax Invoice')
    expect(t).toContain('Total payable')
    expect(t).toContain('المبلغ المستحق')
    expect(html).toContain('class="bi"')
  })

  it('keeps the colon inside each language run of bilingual field labels (bidi-safe)', () => {
    const html = buildUaeInvoiceHtml(sample({ outputLang: 'bilingual' }))
    // The colon must sit inside the RTL span so it renders right after the Arabic word,
    // not between the "/" separator and the Arabic label.
    expect(html).toContain('<span lang="ar" dir="rtl">رقم الفاتورة:</span>')
    expect(html).toMatch(/<span lang="en">Invoice no\.?:<\/span>/)
    expect(html).not.toMatch(/<\/span><\/span>: /)
  })

  it('omits recipient and number blocks on a simplified invoice when empty', () => {
    const html = buildUaeInvoiceHtml(
      sample({
        type: 'simplified',
        invoiceNumber: '',
        recipient: { name: '', address: '', trn: '', vatRegistered: false },
      }),
    )
    const t = text(html)
    expect(t).toContain('Simplified Tax Invoice')
    expect(t).not.toContain('Bill to')
    expect(t).not.toContain('Invoice no.')
  })

  it('escapes user input', () => {
    const html = buildUaeInvoiceHtml(
      sample({ supplier: { name: '<script>x</script>', address: 'a', trn: '1' } }),
    )
    expect(html).not.toContain('<script>x')
    expect(html).toContain('&lt;script&gt;')
  })

  it('states that this is a PDF tax invoice, not a Peppol e-invoice', () => {
    expect(text(buildUaeInvoiceHtml(sample()))).toMatch(/not a Peppol/i)
  })
})
