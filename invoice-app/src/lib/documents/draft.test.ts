import { beforeEach, describe, expect, it } from 'vitest'
import {
  DOCUMENT_DRAFT_KEYS,
  createEmptyCreditNoteDraft,
  createEmptyQuotationDraft,
  createEmptyReceiptDraft,
  loadDocumentDraft,
  parseCreditNoteDraft,
  parseQuotationDraft,
  parseReceiptDraft,
  saveDocumentDraft,
  writeQuotationToInvoiceTool,
} from './draft'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('document drafts', () => {
  it('uses one versioned localStorage key per document', () => {
    expect(DOCUMENT_DRAFT_KEYS).toEqual({
      'receipt-voucher': 'qaftr:receipt-voucher-draft:v1',
      quotation: 'qaftr:quotation-draft:v1',
      'credit-note': 'qaftr:credit-note-draft:v1',
    })
  })

  it('creates empty drafts with a default number, date and output language', () => {
    expect(createEmptyReceiptDraft('2026-11-09', 'en')).toMatchObject({
      number: 'RV-0001',
      date: '2026-11-09',
      paymentMethod: 'cash',
      outputLang: 'en',
    })
    expect(createEmptyQuotationDraft('2026-11-09', 'ar')).toMatchObject({
      number: 'Q-0001',
      validUntil: '2026-11-23',
      outputLang: 'ar',
    })
    expect(createEmptyCreditNoteDraft('2026-11-09', 'ar')).toMatchObject({ number: 'CN-0001', reason: '' })
  })

  it('round-trips through localStorage', () => {
    const draft = { ...createEmptyQuotationDraft('2026-11-09', 'bilingual'), terms: 'نقداً' }
    saveDocumentDraft('quotation', draft)
    expect(loadDocumentDraft('quotation')).toEqual(draft)
  })

  it('parses stored drafts defensively', () => {
    expect(parseReceiptDraft(null)).toBeNull()
    expect(parseReceiptDraft('{bad')).toBeNull()
    expect(parseQuotationDraft(JSON.stringify({ lines: 'x' }))).toBeNull()
    const receipt = parseReceiptDraft(
      JSON.stringify({ number: 5, paymentMethod: 'bitcoin', outputLang: 'fr', amount: '10' }),
    )
    expect(receipt).toMatchObject({ number: '', paymentMethod: 'cash', outputLang: 'ar', amount: '10' })
    const note = parseCreditNoteDraft(
      JSON.stringify({
        reason: 'gift',
        seller: { name: 'x' },
        buyer: {},
        lines: [{ description: 'a', qty: '1', unitPrice: '2' }, 'junk'],
      }),
    )
    expect(note?.reason).toBe('')
    expect(note?.seller).toEqual({ name: 'x', address: '', vatNumber: '' })
    expect(note?.lines).toHaveLength(1)
  })

  it('writes a converted quotation in the Saudi invoice tool draft format', () => {
    const draft = {
      ...createEmptyQuotationDraft('2026-11-09', 'ar'),
      seller: { name: 'مؤسسة قافتر', address: 'الرياض', vatNumber: '' },
      buyer: { name: 'شركة الأفق', address: '', vatNumber: '' },
      lines: [{ description: 'تصميم', qty: '1', unitPrice: '1000' }],
    }
    expect(writeQuotationToInvoiceTool(draft)).toBe(true)
    const stored = JSON.parse(sessionStorage.getItem('qaftr:instant-invoice-draft') ?? '{}')
    expect(stored.sellerName).toBe('مؤسسة قافتر')
    expect(stored.clientName).toBe('شركة الأفق')
    expect(stored.lineItems[0]).toMatchObject({ description: 'تصميم', unitPrice: '1000' })
  })
})
