import { describe, expect, it } from 'vitest'
import { buildCreditNoteHtml, buildQuotationHtml, buildReceiptHtml } from './document-html'
import { createEmptyCreditNoteDraft, createEmptyQuotationDraft, createEmptyReceiptDraft } from './draft'
import type { CreditNoteDraft, DocumentOutputLang, QuotationDraft, ReceiptDraft } from './draft'

const VAT = '300000000000003'

function receipt(outputLang: DocumentOutputLang, patch: Partial<ReceiptDraft> = {}): ReceiptDraft {
  return {
    ...createEmptyReceiptDraft('2026-11-09', outputLang),
    issuerName: 'مؤسسة قافتر',
    receivedFrom: 'شركة الأفق',
    amount: '1200',
    purpose: 'دفعة مقدمة',
    receiverName: 'أحمد',
    ...patch,
  }
}

function quotation(outputLang: DocumentOutputLang): QuotationDraft {
  return {
    ...createEmptyQuotationDraft('2026-11-09', outputLang),
    seller: { name: 'مؤسسة قافتر', address: 'الرياض', vatNumber: VAT },
    buyer: { name: 'شركة الأفق', address: 'جدة', vatNumber: '' },
    lines: [{ description: 'تصميم <b>شعار</b>', qty: '2', unitPrice: '500' }],
    terms: 'الدفع خلال ٣٠ يوماً',
  }
}

function creditNote(outputLang: DocumentOutputLang): CreditNoteDraft {
  return {
    ...createEmptyCreditNoteDraft('2026-11-09', outputLang),
    originalInvoiceNumber: 'INV-0042',
    originalInvoiceDate: '2026-10-20',
    reason: 'return',
    seller: { name: 'مؤسسة قافتر', address: 'الرياض', vatNumber: VAT },
    buyer: { name: 'شركة الأفق', address: 'جدة', vatNumber: '' },
    lines: [{ description: 'مرتجع', qty: '1', unitPrice: '100' }],
  }
}

describe('buildReceiptHtml', () => {
  it('prints an Arabic receipt voucher with the amount in figures and words', () => {
    const html = buildReceiptHtml(receipt('ar'))
    expect(html).toContain('<html lang="ar" dir="rtl">')
    expect(html).toContain('سند قبض')
    expect(html).toContain('1,200.00')
    expect(html).toContain('فقط ألف ومئتان ريال سعودي لا غير')
    expect(html).toContain('نقداً')
    expect(html).toContain('توقيع المستلم')
    expect(html).toContain('ليس فاتورة ضريبية')
    expect(html).not.toContain('Receipt Voucher')
  })

  it('prints English and bilingual versions with both words', () => {
    const en = buildReceiptHtml(receipt('en'))
    expect(en).toContain('<html lang="en" dir="ltr">')
    expect(en).toContain('Receipt Voucher')
    expect(en).toContain('One thousand two hundred Saudi riyals only')
    expect(en).toContain('not a tax invoice')
    const bi = buildReceiptHtml(receipt('bilingual'))
    expect(bi).toContain('Receipt Voucher')
    expect(bi).toContain('سند قبض')
    expect(bi).toContain('فقط ألف ومئتان ريال سعودي لا غير')
    expect(bi).toContain('One thousand two hundred Saudi riyals only')
  })

  it('shows cheque details only for cheques and escapes user text', () => {
    const cheque = buildReceiptHtml(
      receipt('en', { paymentMethod: 'cheque', chequeNumber: '000123', bankName: 'Al <Rajhi>' }),
    )
    expect(cheque).toContain('000123')
    expect(cheque).toContain('Al &lt;Rajhi&gt;')
    expect(buildReceiptHtml(receipt('en'))).not.toContain('Cheque no.')
  })
})

describe('buildQuotationHtml', () => {
  it('prints a quotation with 15% VAT totals, validity and terms', () => {
    const html = buildQuotationHtml(quotation('ar'))
    expect(html).toContain('عرض سعر')
    expect(html).toContain('صالح حتى')
    expect(html).toContain('1,000.00')
    expect(html).toContain('150.00')
    expect(html).toContain('1,150.00')
    expect(html).toContain('الدفع خلال ٣٠ يوماً')
    expect(html).toContain('تصميم &lt;b&gt;شعار&lt;/b&gt;')
    expect(html).toContain('البائع')
    expect(html).toContain('المشتري')
  })

  it('has an English title and bilingual labels', () => {
    expect(buildQuotationHtml(quotation('en'))).toContain('Quotation')
    const bi = buildQuotationHtml(quotation('bilingual'))
    expect(bi).toContain('Quotation')
    expect(bi).toContain('عرض سعر')
  })
})

describe('buildCreditNoteHtml', () => {
  it('is titled إشعار دائن and references the original tax invoice', () => {
    const html = buildCreditNoteHtml(creditNote('ar'))
    expect(html).toContain('إشعار دائن')
    expect(html).toContain('INV-0042')
    expect(html).toContain('20 أكتوبر 2026')
    expect(html).toContain('إرجاع السلع أو الخدمات')
    expect(html).toContain(VAT)
    expect(html).toContain('115.00')
    expect(html).toContain('الفاتورة الضريبية')
  })

  it('is titled Credit Note in English and both in bilingual', () => {
    const en = buildCreditNoteHtml(creditNote('en'))
    expect(en).toContain('Credit Note')
    expect(en).toContain('This credit note relates to tax invoice no.')
    const bi = buildCreditNoteHtml(creditNote('bilingual'))
    expect(bi).toContain('Credit Note')
    expect(bi).toContain('إشعار دائن')
  })

  it('prints the free-text reason for "other"', () => {
    const html = buildCreditNoteHtml({ ...creditNote('en'), reason: 'other', reasonDetail: 'Goodwill adjustment' })
    expect(html).toContain('Goodwill adjustment')
  })
})
