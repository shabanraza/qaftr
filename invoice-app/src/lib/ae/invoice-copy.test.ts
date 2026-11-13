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
})
