/**
 * Money totals for the dashboard and the accountant packet. Credit notes are
 * stored with positive amounts; here they count against sales and VAT.
 */
import { amountSign, isNote } from '#/lib/zatca/document-kind'
import type { DocumentKind } from '#/lib/zatca/document-kind'
import { invoiceStatusTone, renderInvoiceStatus } from './invoice-status'

type Money = { subtotal: string; vatAmount: string; total: string; zatcaKind?: DocumentKind | null }
type Dated = Money & { issueDate: Date | string; status: string }

const num = (v: string) => parseFloat(v) || 0
const signed = (doc: Money, v: string) => amountSign(doc.zatcaKind) * num(v)

/** Net sales (incl. VAT) issued since the start of `now`'s month. */
export function monthSalesTotal(docs: Array<Pick<Dated, 'issueDate' | 'total' | 'zatcaKind'>>, now: Date = new Date()): string {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  let total = 0
  for (const d of docs) if (new Date(d.issueDate) >= monthStart) total += amountSign(d.zatcaKind) * num(d.total)
  return total.toFixed(2)
}

export function groupByMonth<T extends Dated>(docs: T[]) {
  const groups = new Map<string, T[]>()
  for (const d of docs) {
    const date = new Date(d.issueDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    groups.set(key, [...(groups.get(key) ?? []), d])
  }
  return [...groups.entries()]
    .map(([monthKey, items]) => {
      let subtotal = 0
      let vatAmount = 0
      let total = 0
      let paidTotal = 0
      for (const d of items) {
        subtotal += signed(d, d.subtotal)
        vatAmount += signed(d, d.vatAmount)
        total += signed(d, d.total)
        if (d.status === 'paid') paidTotal += signed(d, d.total)
      }
      return {
        monthKey,
        invoices: items,
        count: items.length,
        subtotal: subtotal.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        total: total.toFixed(2),
        paidTotal: paidTotal.toFixed(2),
      }
    })
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
}

export function overallTotals(docs: Money[]) {
  let totalVat = 0
  let totalSales = 0
  for (const d of docs) {
    totalVat += signed(d, d.vatAmount)
    totalSales += signed(d, d.total)
  }
  return {
    salesCount: docs.filter((d) => !isNote(d.zatcaKind)).length,
    totalVat: totalVat.toFixed(2),
    totalSales: totalSales.toFixed(2),
  }
}

/** Subtotal, VAT and total for a CSV row; negative for credit notes. */
export function csvAmounts(doc: Money): [string, string, string] {
  return [signed(doc, doc.subtotal).toFixed(2), signed(doc, doc.vatAmount).toFixed(2), signed(doc, doc.total).toFixed(2)]
}

const NOTE_LABEL = {
  'credit-note': { ar: 'إشعار دائن', en: 'Credit note' },
  'debit-note': { ar: 'إشعار مدين', en: 'Debit note' },
} as const

const NOTE_TONE = 'border-sky-200 bg-sky-50 text-sky-700'

/** Status badge: notes have no payment status, so they show their kind. */
export function documentBadge(doc: { status: string; zatcaKind?: DocumentKind | null }, lang: 'ar' | 'en') {
  if (doc.zatcaKind === 'credit-note' || doc.zatcaKind === 'debit-note') {
    return { label: NOTE_LABEL[doc.zatcaKind][lang], tone: NOTE_TONE }
  }
  return { label: renderInvoiceStatus(doc.status, lang), tone: invoiceStatusTone[doc.status] ?? invoiceStatusTone.draft! }
}
