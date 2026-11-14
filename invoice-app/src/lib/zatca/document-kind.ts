/** Display helpers for invoices, credit notes and debit notes stored in the invoices table. */
export type DocumentKind = 'invoice' | 'credit-note' | 'debit-note'

const PREFIX: Record<DocumentKind, string> = { invoice: 'INV', 'credit-note': 'CN', 'debit-note': 'DN' }

export function documentNumber(seqNumber: number, kind?: DocumentKind | null): string {
  return `${PREFIX[kind ?? 'invoice']}-${String(seqNumber).padStart(3, '0')}`
}

/** Credit notes reduce sales and VAT; invoices and debit notes add to them. */
export function amountSign(kind?: DocumentKind | null): 1 | -1 {
  return kind === 'credit-note' ? -1 : 1
}

export const isNote = (kind?: DocumentKind | null) => kind === 'credit-note' || kind === 'debit-note'
