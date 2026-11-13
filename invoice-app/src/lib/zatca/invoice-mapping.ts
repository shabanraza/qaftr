/**
 * Maps a saved Qaftr invoice (DB rows) to a ZATCA UBL input for one EGS
 * chain position. Decides standard (B2B) vs simplified (B2C) from the client,
 * freezes the issue date/time in Riyadh time, and refuses documents whose
 * e-invoice totals would differ from what the customer already sees.
 */
import { buyerStandardReadiness, normalizePartyInput, sellerZatcaReadiness } from '@zatca/shared'
import type { PartyIssue } from '@zatca/shared'
import { computeZatcaTotals } from '@zatca/shared/zatca-phase2'
import type { BuyerIdScheme, ZatcaBuyer, ZatcaInvoiceInput, ZatcaInvoiceSubtype, ZatcaLineInput, ZatcaVatCategory } from '@zatca/shared/zatca-phase2'
import type { OnboardingEnv } from './onboarding'
import { ZATCA_SANDBOX_VAT } from './onboarding'

type Text = string | null

export interface MappingInput {
  env: OnboardingEnv
  invoice: { seqNumber: number; subtotal: string; vatAmount: string; total: string; notes: Text }
  items: Array<{
    description: string
    qty: string
    unitPrice: string
    vatCategory: ZatcaVatCategory
    vatRate: string
    exemptionCode: Text
    exemptionReason: Text
    discountPerUnit: Text
  }>
  business: {
    nameAr: Text
    nameEn: Text
    vatNumber: Text
    crNumber: Text
    street: Text
    buildingNumber: Text
    additionalNumber: Text
    district: Text
    city: Text
    postalCode: Text
  }
  client: {
    name: Text
    vatNumber: Text
    country: Text
    idScheme: Text
    idValue: Text
    street: Text
    buildingNumber: Text
    additionalNumber: Text
    district: Text
    city: Text
    postalCode: Text
  } | null
  chain: { icv: number; pih: string }
  uuid: string
  now: Date
}

export type InvoiceMappingErrorCode = 'SELLER_NOT_READY' | 'BUYER_NOT_READY' | 'INVOICE_TOTALS_MISMATCH'

export class InvoiceMappingError extends Error {
  readonly code: InvoiceMappingErrorCode
  readonly issues?: PartyIssue[]
  constructor(code: InvoiceMappingErrorCode, issues?: PartyIssue[]) {
    super(code)
    this.name = 'InvoiceMappingError'
    this.code = code
    this.issues = issues
  }
}

export interface ZatcaDocument {
  input: ZatcaInvoiceInput
  subtype: ZatcaInvoiceSubtype
  issueDateKsa: string
  issueTimeKsa: string
}

const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000 // Asia/Riyadh is UTC+3 all year

export function riyadhDateTime(now: Date): { date: string; time: string } {
  const iso = new Date(now.getTime() + RIYADH_OFFSET_MS).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) }
}

export const invoiceNumber = (seq: number) => `INV-${String(seq).padStart(3, '0')}`

const money = (s: string) => Number(s).toFixed(2)

export function toZatcaDocument(m: MappingInput): ZatcaDocument {
  const sellerReady = sellerZatcaReadiness({ ...m.business, name: m.business.nameAr })
  if (!sellerReady.ready) throw new InvoiceMappingError('SELLER_NOT_READY', sellerReady.issues)
  const s = normalizePartyInput({ ...m.business, name: m.business.nameAr })

  const c = m.client ? normalizePartyInput(m.client) : null
  const isB2b = Boolean(c && (c.vatNumber || (c.idScheme && c.idValue)))
  const subtype: ZatcaInvoiceSubtype = isB2b ? 'standard' : 'simplified'

  let buyer: ZatcaBuyer | undefined
  if (isB2b && c) {
    const ready = buyerStandardReadiness(m.client!)
    if (!ready.ready) throw new InvoiceMappingError('BUYER_NOT_READY', ready.issues)
    const address = Object.fromEntries(
      Object.entries({
        street: c.street,
        buildingNumber: c.buildingNumber,
        plotIdentification: c.additionalNumber,
        district: c.district,
        city: c.city,
        postalCode: c.postalCode,
        country: c.country ?? 'SA',
      }).filter(([, v]) => v),
    )
    buyer = {
      registrationName: c.name!,
      ...(c.vatNumber ? { vatNumber: c.vatNumber } : { otherId: { scheme: c.idScheme as BuyerIdScheme, value: c.idValue! } }),
      address,
    }
  } else if (c?.name) {
    buyer = { registrationName: c.name }
  }

  const lines: ZatcaLineInput[] = m.items.map((it) => ({
    name: it.description,
    quantity: Number(it.qty),
    unitPrice: Number(it.unitPrice),
    ...(it.discountPerUnit && Number(it.discountPerUnit) > 0 ? { discountPerUnit: Number(it.discountPerUnit) } : {}),
    vatCategory: it.vatCategory,
    vatRate: Number(it.vatRate),
    ...(it.exemptionCode ? { exemptionReasonCode: it.exemptionCode } : {}),
    ...(it.exemptionReason ? { exemptionReason: it.exemptionReason } : {}),
  }))

  const totals = computeZatcaTotals(lines)
  if (
    totals.taxExclusive.toFixed(2) !== money(m.invoice.subtotal) ||
    totals.vatTotal.toFixed(2) !== money(m.invoice.vatAmount) ||
    totals.taxInclusive.toFixed(2) !== money(m.invoice.total)
  ) {
    throw new InvoiceMappingError('INVOICE_TOTALS_MISMATCH')
  }

  const { date, time } = riyadhDateTime(m.now)
  const input: ZatcaInvoiceInput = {
    kind: 'invoice',
    subtype,
    id: invoiceNumber(m.invoice.seqNumber),
    uuid: m.uuid,
    issueDate: date,
    issueTime: time,
    icv: m.chain.icv,
    pih: m.chain.pih,
    seller: {
      registrationName: s.name!,
      vatNumber: m.env === 'sandbox' ? ZATCA_SANDBOX_VAT : s.vatNumber!,
      otherId: { scheme: 'CRN', value: s.crNumber! },
      address: {
        street: s.street!,
        buildingNumber: s.buildingNumber!,
        ...(s.additionalNumber ? { plotIdentification: s.additionalNumber } : {}),
        district: s.district!,
        city: s.city!,
        postalCode: s.postalCode!,
        country: 'SA',
      },
    },
    ...(buyer ? { buyer } : {}),
    ...(subtype === 'standard' ? { supplyDate: date } : {}),
    paymentMeansCode: subtype === 'standard' ? '42' : '10',
    ...(m.invoice.notes?.trim() ? { note: m.invoice.notes.trim().slice(0, 1000) } : {}),
    lines,
  }
  return { input, subtype, issueDateKsa: date, issueTimeKsa: time }
}
