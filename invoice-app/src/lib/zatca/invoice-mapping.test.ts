// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { FIRST_INVOICE_PIH, buildInvoiceXml } from '@zatca/shared/zatca-phase2'
import { InvoiceMappingError, toZatcaDocument } from './invoice-mapping'
import type { MappingInput } from './invoice-mapping'

const business = {
  nameAr: 'مؤسسة قافتر التجارية',
  nameEn: null,
  vatNumber: '300000000000003',
  crNumber: '1010010000',
  street: 'King Fahd Road',
  buildingNumber: '1234',
  additionalNumber: '5678',
  district: 'Al Olaya',
  city: 'Riyadh',
  postalCode: '12211',
}

const b2bClient = {
  name: 'Buyer Trading LLC',
  vatNumber: '310000000000003',
  country: 'SA',
  idScheme: null,
  idValue: null,
  street: 'Prince Sultan St',
  buildingNumber: '4321',
  additionalNumber: null,
  district: 'Al Rawdah',
  city: 'Jeddah',
  postalCode: '23435',
}

const base: MappingInput = {
  env: 'simulation',
  invoice: { seqNumber: 7, subtotal: '150.00', vatAmount: '22.50', total: '172.50', notes: null },
  items: [
    { description: 'Consulting hour', qty: '1.000', unitPrice: '100.00', vatCategory: 'S', vatRate: '15.00', exemptionCode: null, exemptionReason: null, discountPerUnit: null },
    { description: 'Report', qty: '2.000', unitPrice: '25.00', vatCategory: 'S', vatRate: '15.00', exemptionCode: null, exemptionReason: null, discountPerUnit: null },
  ],
  business,
  client: null,
  chain: { icv: 12, pih: FIRST_INVOICE_PIH },
  uuid: '6f1c8a52-2c1e-4c6b-9a57-0d5b4f3f2a10',
  // 22:30 UTC is already the next day in Riyadh (UTC+3).
  now: new Date('2026-11-13T22:30:15Z'),
}

describe('toZatcaDocument', () => {
  it('builds a simplified invoice for a walk-in customer, dated in Riyadh time', () => {
    const doc = toZatcaDocument(base)
    expect(doc.subtype).toBe('simplified')
    expect(doc.issueDateKsa).toBe('2026-11-14')
    expect(doc.issueTimeKsa).toBe('01:30:15')
    expect(doc.input).toMatchObject({
      kind: 'invoice',
      subtype: 'simplified',
      id: 'INV-007',
      uuid: base.uuid,
      icv: 12,
      pih: FIRST_INVOICE_PIH,
      issueDate: '2026-11-14',
      issueTime: '01:30:15',
      paymentMeansCode: '10',
    })
    expect(doc.input.buyer).toBeUndefined()
    expect(doc.input.seller).toMatchObject({
      registrationName: business.nameAr,
      vatNumber: business.vatNumber,
      otherId: { scheme: 'CRN', value: '1010010000' },
      address: { buildingNumber: '1234', plotIdentification: '5678', postalCode: '12211', country: 'SA' },
    })
    expect(doc.input.lines).toEqual([
      { name: 'Consulting hour', quantity: 1, unitPrice: 100, vatCategory: 'S', vatRate: 15 },
      { name: 'Report', quantity: 2, unitPrice: 25, vatCategory: 'S', vatRate: 15 },
    ])
    expect(() => buildInvoiceXml(doc.input, { now: base.now })).not.toThrow()
  })

  it('builds a standard (B2B) invoice when the client has a VAT number', () => {
    const doc = toZatcaDocument({ ...base, client: b2bClient })
    expect(doc.subtype).toBe('standard')
    expect(doc.input).toMatchObject({
      subtype: 'standard',
      supplyDate: '2026-11-14',
      paymentMeansCode: '42',
      buyer: {
        registrationName: 'Buyer Trading LLC',
        vatNumber: '310000000000003',
        address: { street: 'Prince Sultan St', buildingNumber: '4321', city: 'Jeddah', postalCode: '23435', country: 'SA' },
      },
    })
    expect(() => buildInvoiceXml(doc.input, { now: base.now })).not.toThrow()
  })

  it('uses another buyer ID when there is no VAT number', () => {
    const doc = toZatcaDocument({ ...base, client: { ...b2bClient, vatNumber: null, idScheme: 'CRN', idValue: '4030000000' } })
    expect(doc.subtype).toBe('standard')
    expect(doc.input.buyer).toMatchObject({ otherId: { scheme: 'CRN', value: '4030000000' } })
    expect(doc.input.buyer?.vatNumber).toBeUndefined()
  })

  it('treats a client with only a name as a simplified-invoice buyer', () => {
    const doc = toZatcaDocument({ ...base, client: { ...b2bClient, vatNumber: null, street: null } })
    expect(doc.subtype).toBe('simplified')
    expect(doc.input.buyer).toEqual({ registrationName: 'Buyer Trading LLC' })
  })

  it('refuses a B2B client whose Saudi address is incomplete', () => {
    expect(() => toZatcaDocument({ ...base, client: { ...b2bClient, postalCode: null } })).toThrowError(
      expect.objectContaining({ code: 'BUYER_NOT_READY' }),
    )
  })

  it('refuses an incomplete seller profile', () => {
    expect(() => toZatcaDocument({ ...base, business: { ...business, crNumber: null } })).toThrowError(
      expect.objectContaining({ code: 'SELLER_NOT_READY' }),
    )
  })

  it('refuses when the stored totals differ from the e-invoice totals', () => {
    const err = (() => {
      try {
        toZatcaDocument({ ...base, invoice: { ...base.invoice, total: '172.60' } })
      } catch (e) {
        return e
      }
    })()
    expect(err).toBeInstanceOf(InvoiceMappingError)
    expect(err).toMatchObject({ code: 'INVOICE_TOTALS_MISMATCH' })
  })

  it('signs as the documented sandbox taxpayer in the sandbox', () => {
    expect(toZatcaDocument({ ...base, env: 'sandbox' }).input.seller.vatNumber).toBe('399999999900003')
  })

  it('carries exempt lines with their VATEX code', () => {
    const doc = toZatcaDocument({
      ...base,
      invoice: { seqNumber: 8, subtotal: '200.00', vatAmount: '15.00', total: '215.00', notes: 'Thanks' },
      items: [
        base.items[0]!,
        { description: 'Medicine', qty: '1', unitPrice: '100.00', vatCategory: 'Z', vatRate: '0', exemptionCode: 'VATEX-SA-35', exemptionReason: null, discountPerUnit: null },
      ],
    })
    expect(doc.input.lines[1]).toEqual({
      name: 'Medicine', quantity: 1, unitPrice: 100, vatCategory: 'Z', vatRate: 0, exemptionReasonCode: 'VATEX-SA-35',
    })
    expect(doc.input.note).toBe('Thanks')
  })
})

describe('toZatcaDocument for credit and debit notes', () => {
  it('references the original invoice, keeps its subtype and numbers the note CN-', () => {
    const doc = toZatcaDocument({
      ...base,
      client: b2bClient,
      invoice: { ...base.invoice, seqNumber: 9 },
      note: { kind: 'credit-note', originalNumber: 'INV-007', originalSubtype: 'standard', reason: 'Returned goods' },
    })
    expect(doc.subtype).toBe('standard')
    expect(doc.input).toMatchObject({
      kind: 'credit-note',
      id: 'CN-009',
      billingReference: { invoiceId: 'INV-007' },
      noteReason: 'Returned goods',
    })
    expect(() => buildInvoiceXml(doc.input, { now: base.now })).not.toThrow()
  })

  it('keeps a simplified note simplified even if the client later gained a VAT number', () => {
    const doc = toZatcaDocument({
      ...base,
      client: b2bClient,
      note: { kind: 'debit-note', originalNumber: 'INV-003', originalSubtype: 'simplified', reason: 'Price correction' },
    })
    expect(doc.subtype).toBe('simplified')
    expect(doc.input.id).toBe('DN-007')
    expect(() => buildInvoiceXml(doc.input, { now: base.now })).not.toThrow()
  })
})
