import { describe, expect, it } from 'vitest'
import {
  buildCreateInvoiceInput,
  nextDocumentSeq,
  buildEditorPdfInvoice,
  computeEditorTotals,
  deriveInvoiceType,
  editorIssues,
  formatPartyAddress,
  type EditorBusiness,
  type EditorClient,
  type EditorLine,
} from './invoice-editor'

const business: EditorBusiness = {
  id: 'b1',
  nameAr: 'مؤسسة قافتر',
  nameEn: 'Qaftr Est.',
  vatNumber: '300000000000003',
  address: null,
  logoUrl: null,
  crNumber: '1010010000',
  street: 'King Fahd Rd',
  buildingNumber: '1234',
  additionalNumber: '5678',
  district: 'Olaya',
  city: 'Riyadh',
  postalCode: '12345',
}

const b2bClient: EditorClient = {
  id: 'c1',
  name: 'شركة النور',
  vatNumber: '310000000000003',
  email: null,
  phone: '0500000000',
  country: 'SA',
  idScheme: null,
  idValue: null,
  street: 'Tahlia St',
  buildingNumber: '1111',
  additionalNumber: '2222',
  district: 'Rawdah',
  city: 'Jeddah',
  postalCode: '23456',
}

const consumer: EditorClient = { ...b2bClient, id: 'c2', name: 'Ahmed', vatNumber: null, street: null, buildingNumber: null, district: null, city: null, postalCode: null }

const lines: EditorLine[] = [
  { id: 'l1', description: 'Design', qty: '1', unitPrice: '2000' },
  { id: 'l2', description: 'Printing', qty: '5', unitPrice: '100' },
  { id: 'l3', description: '', qty: '1', unitPrice: '' },
]

describe('deriveInvoiceType', () => {
  it('is a tax invoice for a customer with a VAT number', () => {
    expect(deriveInvoiceType(b2bClient)).toBe('standard')
  })
  it('is a tax invoice for a customer with another business ID', () => {
    expect(deriveInvoiceType({ ...consumer, idScheme: 'CRN', idValue: '1010101010' })).toBe('standard')
  })
  it('is simplified for a consumer or a cash sale', () => {
    expect(deriveInvoiceType(consumer)).toBe('simplified')
    expect(deriveInvoiceType(null)).toBe('simplified')
  })
})

describe('computeEditorTotals', () => {
  it('ignores empty rows and adds 15% VAT', () => {
    const totals = computeEditorTotals(lines)
    expect(totals.lineItems).toHaveLength(2)
    expect(totals.subtotal).toBe('2500.00')
    expect(totals.vatAmount).toBe('375.00')
    expect(totals.total).toBe('2875.00')
  })
})

describe('formatPartyAddress', () => {
  it('joins the structured address parts', () => {
    expect(formatPartyAddress(b2bClient)).toBe('1111 Tahlia St, Rawdah, Jeddah 23456')
  })
  it('is null when nothing is filled', () => {
    expect(formatPartyAddress(consumer)).toBeNull()
  })
})

describe('editorIssues', () => {
  it('needs at least one priced line', () => {
    expect(editorIssues({ business, client: null, lines: [lines[2]!] })).toContain('NO_LINES')
  })
  it('needs a business profile', () => {
    expect(editorIssues({ business: null, client: null, lines })).toContain('NO_BUSINESS')
  })
  it('flags a business customer whose address is incomplete', () => {
    expect(editorIssues({ business, client: { ...b2bClient, city: null }, lines })).toContain('BUYER_INCOMPLETE')
  })
  it('is empty when ready', () => {
    expect(editorIssues({ business, client: b2bClient, lines })).toEqual([])
    expect(editorIssues({ business, client: null, lines })).toEqual([])
  })
})

describe('buildEditorPdfInvoice', () => {
  it('maps profile, customer and rows into the PDF shape', () => {
    const pdf = buildEditorPdfInvoice({
      business,
      client: b2bClient,
      lines,
      notes: 'Thanks',
      supplyDate: '',
      issueDate: new Date('2026-11-14T10:00:00Z'),
      seqNumber: 4,
      cashCustomerName: 'Cash customer',
    })
    expect(pdf.invoiceType).toBe('standard')
    expect(pdf.seqNumber).toBe(4)
    expect(pdf.business?.nameAr).toBe('مؤسسة قافتر')
    expect(pdf.business?.address).toBe('1234 King Fahd Rd, Olaya, Riyadh 12345')
    expect(pdf.client?.name).toBe('شركة النور')
    expect(pdf.client?.address).toBe('1111 Tahlia St, Rawdah, Jeddah 23456')
    expect(pdf.lineItems).toHaveLength(2)
    expect(pdf.total).toBe('2875.00')
    expect(pdf.notes).toBe('Thanks')
    expect(pdf.supplyDate).toBeNull()
  })

  it('prints a cash customer name for a walk-in sale', () => {
    const pdf = buildEditorPdfInvoice({
      business,
      client: null,
      lines,
      notes: '',
      supplyDate: '2026-11-10',
      issueDate: new Date(),
      seqNumber: 1,
      cashCustomerName: 'عميل نقدي',
    })
    expect(pdf.invoiceType).toBe('simplified')
    expect(pdf.client?.name).toBe('عميل نقدي')
    expect(pdf.notes).toBeNull()
    expect(pdf.supplyDate).toBe('2026-11-10')
  })
})

describe('buildCreateInvoiceInput', () => {
  it('builds the invoices.create payload linked to the customer', () => {
    const input = buildCreateInvoiceInput({
      business,
      client: b2bClient,
      lines,
      notes: ' ',
      supplyDate: '2026-11-10',
      dueDate: '2026-12-01',
      issueDate: new Date('2026-11-14T10:00:00Z'),
      status: 'draft',
    })
    expect(input).toMatchObject({
      businessId: 'b1',
      clientId: 'c1',
      issueDate: '2026-11-14T10:00:00.000Z',
      dueDate: '2026-12-01',
      supplyDate: '2026-11-10',
      status: 'draft',
      subtotal: '2500.00',
      vatAmount: '375.00',
      total: '2875.00',
    })
    expect(input.notes).toBeUndefined()
    expect(input.lineItems.map((l) => l.sortOrder)).toEqual([0, 1])
  })

  it('leaves clientId out for a cash sale', () => {
    const input = buildCreateInvoiceInput({ business, client: null, lines, notes: '', supplyDate: '', dueDate: '', issueDate: new Date(), status: 'unpaid' })
    expect(input.clientId).toBeUndefined()
    expect(input.dueDate).toBeUndefined()
    expect(input.supplyDate).toBeUndefined()
  })
})

describe('nextDocumentSeq', () => {
  it('starts at 1 with no documents', () => {
    expect(nextDocumentSeq([])).toBe(1)
  })

  it('continues after credit and debit notes, which share the sequence with invoices', () => {
    expect(
      nextDocumentSeq([
        { seqNumber: 3, zatcaKind: null },
        { seqNumber: 4, zatcaKind: 'credit-note' },
        { seqNumber: 2, zatcaKind: 'invoice' },
      ]),
    ).toBe(5)
  })
})
