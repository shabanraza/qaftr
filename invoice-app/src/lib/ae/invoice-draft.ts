import { getUaeInvoiceTitle } from '@zatca/shared'
import type {
  UaeInvoiceLineInput,
  UaeInvoiceOutputLang,
  UaeInvoiceType,
  UaeTaxInvoiceInput,
  UaeVatCategory,
} from '@zatca/shared'
import { AE_INVOICE_CONFIG } from '#/lib/invoice/country-config'

export const UAE_INVOICE_DRAFT_KEY = AE_INVOICE_CONFIG.draftStorageKey

export interface UaeInvoiceDraftLine extends UaeInvoiceLineInput {
  qty: string
  unitPrice: string
  discount: string
}

export interface UaeInvoiceDraft {
  type: UaeInvoiceType
  outputLang: UaeInvoiceOutputLang
  invoiceNumber: string
  issueDate: string
  supplyDate: string
  supplier: { name: string; address: string; trn: string }
  recipient: { name: string; address: string; trn: string; vatRegistered: boolean }
  lines: UaeInvoiceDraftLine[]
  notes: string
}

export function createEmptyLine(): UaeInvoiceDraftLine {
  return { description: '', qty: '1', unitPrice: '', discount: '', vatCategory: 'standard' }
}

export function createEmptyUaeDraft(
  today: string,
  outputLang: UaeInvoiceOutputLang,
): UaeInvoiceDraft {
  return {
    type: 'full',
    outputLang,
    invoiceNumber: 'INV-0001',
    issueDate: today,
    supplyDate: '',
    supplier: { name: '', address: '', trn: '' },
    recipient: { name: '', address: '', trn: '', vatRegistered: false },
    lines: [createEmptyLine()],
    notes: '',
  }
}

const str = (v: unknown) => (typeof v === 'string' ? v.slice(0, 500) : '')
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback

const CATEGORIES: readonly UaeVatCategory[] = ['standard', 'zero', 'exempt']

/** Parses a stored draft defensively; anything unexpected becomes a safe default. */
export function parseUaeDraft(raw: string | null): UaeInvoiceDraft | null {
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(data) || !isRecord(data.supplier) || !isRecord(data.recipient)) return null
  if (!Array.isArray(data.lines)) return null
  const { supplier, recipient } = data
  return {
    type: oneOf(data.type, ['full', 'simplified'] as const, 'full'),
    outputLang: oneOf(data.outputLang, ['ar', 'en', 'bilingual'] as const, 'ar'),
    invoiceNumber: str(data.invoiceNumber),
    issueDate: str(data.issueDate),
    supplyDate: str(data.supplyDate),
    supplier: { name: str(supplier.name), address: str(supplier.address), trn: str(supplier.trn) },
    recipient: {
      name: str(recipient.name),
      address: str(recipient.address),
      trn: str(recipient.trn),
      vatRegistered: recipient.vatRegistered === true,
    },
    lines: data.lines.slice(0, 50).filter(isRecord).map((l) => ({
      description: str(l.description),
      qty: str(l.qty),
      unitPrice: str(l.unitPrice),
      discount: str(l.discount),
      vatCategory: oneOf(l.vatCategory, CATEGORIES, 'standard'),
    })),
    notes: str(data.notes),
  }
}

export function loadUaeDraft(): UaeInvoiceDraft | null {
  try {
    return parseUaeDraft(window.localStorage.getItem(UAE_INVOICE_DRAFT_KEY))
  } catch {
    return null
  }
}

export function saveUaeDraft(draft: UaeInvoiceDraft): void {
  try {
    window.localStorage.setItem(UAE_INVOICE_DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // storage full or blocked (private mode): the draft just isn't kept
  }
}

export function toUaeTaxInvoiceInput(draft: UaeInvoiceDraft): UaeTaxInvoiceInput {
  return {
    type: draft.type,
    title: getUaeInvoiceTitle(draft.type, draft.outputLang),
    invoiceNumber: draft.invoiceNumber,
    issueDate: draft.issueDate,
    supplyDate: draft.supplyDate,
    supplier: draft.supplier,
    recipient: draft.recipient,
    lines: draft.lines,
  }
}
