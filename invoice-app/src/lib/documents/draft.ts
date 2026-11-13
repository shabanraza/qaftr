import {
  CREDIT_NOTE_REASONS,
  INSTANT_INVOICE_DRAFT_KEY,
  RECEIPT_PAYMENT_METHODS,
  quotationToInstantInvoiceDraft,
} from '@zatca/shared'
import type {
  CreditNoteInput,
  DocumentLineInput,
  DocumentParty,
  QuotationInput,
  ReceiptVoucherInput,
} from '@zatca/shared'
import type { DocumentKind } from './copy'

export type DocumentOutputLang = 'ar' | 'en' | 'bilingual'

export interface ReceiptDraft extends ReceiptVoucherInput {
  outputLang: DocumentOutputLang
  issuerName: string
  receiverName: string
}

export interface QuotationDraft extends QuotationInput {
  outputLang: DocumentOutputLang
}

export interface CreditNoteDraft extends CreditNoteInput {
  outputLang: DocumentOutputLang
  notes: string
}

export type DocumentDrafts = {
  'receipt-voucher': ReceiptDraft
  quotation: QuotationDraft
  'credit-note': CreditNoteDraft
}

export const DOCUMENT_DRAFT_KEYS: Record<DocumentKind, string> = {
  'receipt-voucher': 'qaftr:receipt-voucher-draft:v1',
  quotation: 'qaftr:quotation-draft:v1',
  'credit-note': 'qaftr:credit-note-draft:v1',
}

const MAX_LINES = 50
const emptyParty = (): DocumentParty => ({ name: '', address: '', vatNumber: '' })
export const createEmptyDocumentLine = (): DocumentLineInput => ({ description: '', qty: '1', unitPrice: '' })

function addDays(iso: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function createEmptyReceiptDraft(today: string, outputLang: DocumentOutputLang): ReceiptDraft {
  return {
    outputLang,
    number: 'RV-0001',
    date: today,
    issuerName: '',
    receivedFrom: '',
    amount: '',
    paymentMethod: 'cash',
    chequeNumber: '',
    bankName: '',
    purpose: '',
    receiverName: '',
  }
}

export function createEmptyQuotationDraft(today: string, outputLang: DocumentOutputLang): QuotationDraft {
  return {
    outputLang,
    number: 'Q-0001',
    date: today,
    validUntil: addDays(today, 14),
    seller: emptyParty(),
    buyer: emptyParty(),
    lines: [createEmptyDocumentLine()],
    terms: '',
  }
}

export function createEmptyCreditNoteDraft(today: string, outputLang: DocumentOutputLang): CreditNoteDraft {
  return {
    outputLang,
    number: 'CN-0001',
    date: today,
    originalInvoiceNumber: '',
    originalInvoiceDate: '',
    reason: '',
    reasonDetail: '',
    seller: emptyParty(),
    buyer: emptyParty(),
    lines: [createEmptyDocumentLine()],
    notes: '',
  }
}

/* --------------------------- defensive parsing --------------------------- */

const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 500) : '')
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback
const OUTPUT_LANGS = ['ar', 'en', 'bilingual'] as const

function parseJson(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const data: unknown = JSON.parse(raw)
    return isRecord(data) ? data : null
  } catch {
    return null
  }
}

const party = (v: unknown): DocumentParty =>
  isRecord(v) ? { name: str(v.name), address: str(v.address), vatNumber: str(v.vatNumber) } : emptyParty()

function lines(v: unknown): DocumentLineInput[] | null {
  if (!Array.isArray(v)) return null
  const parsed = v
    .slice(0, MAX_LINES)
    .filter(isRecord)
    .map((l) => ({ description: str(l.description), qty: str(l.qty), unitPrice: str(l.unitPrice) }))
  return parsed.length ? parsed : [createEmptyDocumentLine()]
}

export function parseReceiptDraft(raw: string | null): ReceiptDraft | null {
  const d = parseJson(raw)
  if (!d) return null
  return {
    outputLang: oneOf(d.outputLang, OUTPUT_LANGS, 'ar'),
    number: str(d.number),
    date: str(d.date),
    issuerName: str(d.issuerName),
    receivedFrom: str(d.receivedFrom),
    amount: str(d.amount),
    paymentMethod: oneOf(d.paymentMethod, RECEIPT_PAYMENT_METHODS, 'cash'),
    chequeNumber: str(d.chequeNumber),
    bankName: str(d.bankName),
    purpose: str(d.purpose),
    receiverName: str(d.receiverName),
  }
}

export function parseQuotationDraft(raw: string | null): QuotationDraft | null {
  const d = parseJson(raw)
  const parsedLines = d ? lines(d.lines) : null
  if (!d || !parsedLines) return null
  return {
    outputLang: oneOf(d.outputLang, OUTPUT_LANGS, 'ar'),
    number: str(d.number),
    date: str(d.date),
    validUntil: str(d.validUntil),
    seller: party(d.seller),
    buyer: party(d.buyer),
    lines: parsedLines,
    terms: str(d.terms),
  }
}

export function parseCreditNoteDraft(raw: string | null): CreditNoteDraft | null {
  const d = parseJson(raw)
  const parsedLines = d ? lines(d.lines) : null
  if (!d || !parsedLines) return null
  return {
    outputLang: oneOf(d.outputLang, OUTPUT_LANGS, 'ar'),
    number: str(d.number),
    date: str(d.date),
    originalInvoiceNumber: str(d.originalInvoiceNumber),
    originalInvoiceDate: str(d.originalInvoiceDate),
    reason: oneOf<CreditNoteDraft['reason']>(d.reason, CREDIT_NOTE_REASONS, ''),
    reasonDetail: str(d.reasonDetail),
    seller: party(d.seller),
    buyer: party(d.buyer),
    lines: parsedLines,
    notes: str(d.notes),
  }
}

const PARSERS: { [TKind in DocumentKind]: (raw: string | null) => DocumentDrafts[TKind] | null } = {
  'receipt-voucher': parseReceiptDraft,
  quotation: parseQuotationDraft,
  'credit-note': parseCreditNoteDraft,
}

export function loadDocumentDraft<TKind extends DocumentKind>(kind: TKind): DocumentDrafts[TKind] | null {
  try {
    return PARSERS[kind](window.localStorage.getItem(DOCUMENT_DRAFT_KEYS[kind]))
  } catch {
    return null
  }
}

export function saveDocumentDraft<TKind extends DocumentKind>(kind: TKind, draft: DocumentDrafts[TKind]): void {
  try {
    window.localStorage.setItem(DOCUMENT_DRAFT_KEYS[kind], JSON.stringify(draft))
  } catch {
    // storage blocked or full: the draft just isn't kept
  }
}

/**
 * Hands a quotation to /tools/fatora: the Saudi tool restores its draft from
 * sessionStorage (same tab) on mount. Returns false when storage is blocked.
 */
export function writeQuotationToInvoiceTool(draft: QuotationDraft): boolean {
  try {
    window.sessionStorage.setItem(
      INSTANT_INVOICE_DRAFT_KEY,
      JSON.stringify(quotationToInstantInvoiceDraft(draft)),
    )
    return true
  } catch {
    return false
  }
}
