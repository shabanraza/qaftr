import { buyerStandardReadiness, computeInvoiceTotals, normalizePartyInput } from '@zatca/shared'
import type { SaudiInvoiceType } from '@zatca/shared'
import type { InvoiceForPdf } from '#/lib/instant-invoice/invoice-pdf'

/**
 * Pure logic for the workspace invoice editor: the invoice type follows the
 * customer (as ZATCA's own mapping does), seller details come from the
 * business profile, and the same data feeds the live PDF preview and the
 * `invoices.create` payload.
 */

type AddressParts = {
  street: string | null
  buildingNumber: string | null
  district: string | null
  city: string | null
  postalCode: string | null
}

export type EditorBusiness = AddressParts & {
  id: string
  nameAr: string
  nameEn: string | null
  vatNumber: string | null
  address: string | null
  logoUrl: string | null
  crNumber: string | null
  additionalNumber: string | null
}

export type EditorClient = AddressParts & {
  id: string
  name: string
  vatNumber: string | null
  email: string | null
  phone: string | null
  country: string | null
  idScheme: string | null
  idValue: string | null
  additionalNumber: string | null
}

export type EditorLine = { id: string; description: string; qty: string; unitPrice: string }

export type EditorIssue = 'NO_BUSINESS' | 'NO_LINES' | 'BUYER_INCOMPLETE'

/** Same rule as `toZatcaDocument`: a VAT number or another business ID makes it a tax invoice. */
export function deriveInvoiceType(client: EditorClient | null): SaudiInvoiceType {
  if (!client) return 'simplified'
  const c = normalizePartyInput(client)
  return c.vatNumber || (c.idScheme && c.idValue) ? 'standard' : 'simplified'
}

/** Rows with a description and a price; blank rows the user hasn't filled are skipped. */
export function filledLines(lines: EditorLine[]): EditorLine[] {
  return lines.filter((line) => line.description.trim() && line.unitPrice.trim())
}

export function computeEditorTotals(lines: EditorLine[]) {
  return computeInvoiceTotals(
    filledLines(lines).map((line) => ({
      description: line.description.trim(),
      qty: line.qty.trim() || '1',
      unitPrice: line.unitPrice,
    })),
  )
}

export function formatPartyAddress(party: AddressParts): string | null {
  const firstLine = [party.buildingNumber, party.street].filter(Boolean).join(' ')
  const cityLine = [party.city, party.postalCode].filter(Boolean).join(' ')
  const parts = [firstLine, party.district, cityLine].map((p) => p?.trim()).filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

export function editorIssues(p: {
  business: EditorBusiness | null
  client: EditorClient | null
  lines: EditorLine[]
}): EditorIssue[] {
  const issues: EditorIssue[] = []
  if (!p.business) issues.push('NO_BUSINESS')
  if (filledLines(p.lines).length === 0) issues.push('NO_LINES')
  if (p.client && deriveInvoiceType(p.client) === 'standard' && !buyerStandardReadiness(p.client).ready) {
    issues.push('BUYER_INCOMPLETE')
  }
  return issues
}

export function buildEditorPdfInvoice(p: {
  business: EditorBusiness | null
  client: EditorClient | null
  lines: EditorLine[]
  notes: string
  supplyDate: string
  issueDate: Date
  seqNumber: number
  cashCustomerName: string
}): InvoiceForPdf {
  const totals = computeEditorTotals(p.lines)
  return {
    invoiceType: deriveInvoiceType(p.client),
    seqNumber: p.seqNumber,
    issueDate: p.issueDate,
    supplyDate: p.supplyDate || null,
    subtotal: totals.subtotal,
    vatAmount: totals.vatAmount,
    total: totals.total,
    currency: 'SAR',
    notes: p.notes.trim() || null,
    business: p.business
      ? {
          nameAr: p.business.nameAr,
          nameEn: p.business.nameEn,
          vatNumber: p.business.vatNumber,
          address: p.business.address || formatPartyAddress(p.business),
          logoUrl: p.business.logoUrl,
        }
      : null,
    client: p.client
      ? {
          name: p.client.name,
          vatNumber: p.client.vatNumber,
          address: formatPartyAddress(p.client),
          email: p.client.email,
          phone: p.client.phone,
        }
      : { name: p.cashCustomerName, vatNumber: null, address: null, email: null, phone: null },
    lineItems: totals.lineItems.map((item) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  }
}

export function buildCreateInvoiceInput(p: {
  business: EditorBusiness
  client: EditorClient | null
  lines: EditorLine[]
  notes: string
  supplyDate: string
  dueDate: string
  issueDate: Date
  status: 'draft' | 'unpaid'
}) {
  const totals = computeEditorTotals(p.lines)
  return {
    businessId: p.business.id,
    clientId: p.client?.id,
    issueDate: p.issueDate.toISOString(),
    dueDate: p.dueDate || undefined,
    supplyDate: p.supplyDate || undefined,
    notes: p.notes.trim() || undefined,
    status: p.status,
    currency: 'SAR',
    subtotal: totals.subtotal,
    vatAmount: totals.vatAmount,
    total: totals.total,
    lineItems: totals.lineItems.map((item, index) => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      sortOrder: index,
    })),
  }
}
