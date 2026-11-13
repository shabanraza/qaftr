import { describe, expect, it } from 'vitest'
import { getAeInvoiceCopy } from './invoice-copy'

describe('UAE simplified tax invoice rule copy', () => {
  it('states the AED 10,000 limit includes VAT and that e-invoicing removes simplified invoices', () => {
    const en = getAeInvoiceCopy('en')
    expect(en.simplifiedRule).toMatch(/AED 10,000 including VAT/)
    expect(en.simplifiedRule).toMatch(/Cabinet Decision No\. 100 of 2025/)
    const faq = en.faq.find((f) => /simplified/i.test(f.question))
    expect(faq?.answer).toMatch(/including VAT/)
    expect(faq?.answer).toMatch(/e-invoicing/)

    const ar = getAeInvoiceCopy('ar')
    expect(ar.simplifiedRule).toMatch(/10,000 درهم شاملة الضريبة/)
    expect(ar.simplifiedRule).toMatch(/قرار مجلس الوزراء رقم 100 لسنة 2025/)
  })

  it('cites Article 59(16) for the e-invoicing exception, verified against the consolidated regulation', () => {
    const en = getAeInvoiceCopy('en')
    const ar = getAeInvoiceCopy('ar')
    expect(en.simplifiedRule).toMatch(/Article 59\(16\)/)
    expect(en.simplifiedRule).toMatch(/voluntar/)
    expect(en.simplifiedRule).not.toMatch(/Verify with the FTA/)
    expect(ar.simplifiedRule).toMatch(/البند 16 من المادة 59/)
    expect(ar.simplifiedRule).not.toMatch(/تحقّق من الهيئة/)
  })
})
