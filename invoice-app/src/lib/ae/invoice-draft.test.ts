import { beforeEach, describe, expect, it } from 'vitest'
import { validateUaeTaxInvoice } from '@zatca/shared'
import {
  UAE_INVOICE_DRAFT_KEY,
  createEmptyUaeDraft,
  loadUaeDraft,
  parseUaeDraft,
  saveUaeDraft,
  toUaeTaxInvoiceInput,
} from './invoice-draft'

describe('UAE invoice draft', () => {
  beforeEach(() => localStorage.clear())

  it('starts as a full tax invoice dated today with one empty standard-rated line', () => {
    const d = createEmptyUaeDraft('2026-11-08', 'ar')
    expect(d).toMatchObject({
      type: 'full',
      outputLang: 'ar',
      invoiceNumber: 'INV-0001',
      issueDate: '2026-11-08',
      supplyDate: '',
    })
    expect(d.lines).toHaveLength(1)
    expect(d.lines[0].vatCategory).toBe('standard')
    expect(d.recipient.vatRegistered).toBe(false)
  })

  it('round-trips through localStorage', () => {
    const d = createEmptyUaeDraft('2026-11-08', 'en')
    d.supplier.name = 'Noor Design'
    saveUaeDraft(d)
    expect(localStorage.getItem(UAE_INVOICE_DRAFT_KEY)).toContain('Noor Design')
    expect(loadUaeDraft()).toEqual(d)
  })

  it('returns null for missing, corrupt or wrong-shaped drafts', () => {
    expect(loadUaeDraft()).toBeNull()
    expect(parseUaeDraft('{oops')).toBeNull()
    expect(parseUaeDraft('[]')).toBeNull()
    expect(parseUaeDraft(JSON.stringify({ type: 'full' }))).toBeNull()
  })

  it('coerces unknown enum values and non-string fields to safe defaults', () => {
    const base = createEmptyUaeDraft('2026-11-08', 'ar')
    const tampered = {
      ...base,
      type: 'bogus',
      outputLang: 'fr',
      supplier: { name: 42, address: null, trn: '100' },
      lines: [{ description: 'x', qty: 2, unitPrice: '5', vatCategory: 'weird' }],
    }
    const d = parseUaeDraft(JSON.stringify(tampered))!
    expect(d.type).toBe('full')
    expect(d.outputLang).toBe('ar')
    expect(d.supplier).toEqual({ name: '', address: '', trn: '100' })
    expect(d.lines[0]).toEqual({
      description: 'x',
      qty: '',
      unitPrice: '5',
      discount: '',
      vatCategory: 'standard',
    })
  })

  it('maps to a validator input whose title matches the type and output language', () => {
    const d = createEmptyUaeDraft('2026-11-08', 'bilingual')
    d.type = 'simplified'
    const input = toUaeTaxInvoiceInput(d)
    expect(input.title).toBe('فاتورة ضريبية مبسطة | Simplified Tax Invoice')
    expect(validateUaeTaxInvoice(input).issues.map((i) => i.code)).not.toContain(
      'TITLE_MISSING_TAX_INVOICE',
    )
  })
})
