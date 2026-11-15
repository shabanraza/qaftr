import { describe, expect, it } from 'vitest'
import { csvAmounts, documentBadge, groupByMonth, monthSalesTotal, overallTotals } from './money-totals'

const doc = (over: Partial<Parameters<typeof groupByMonth>[0][number]> = {}) => ({
  issueDate: new Date('2026-11-05T10:00:00Z'),
  status: 'unpaid',
  subtotal: '100.00',
  vatAmount: '15.00',
  total: '115.00',
  zatcaKind: 'invoice' as const,
  ...over,
})

describe('monthSalesTotal', () => {
  it('adds invoices and debit notes and subtracts credit notes issued this month', () => {
    const now = new Date('2026-11-20T10:00:00Z')
    const total = monthSalesTotal(
      [
        doc(),
        doc({ zatcaKind: 'credit-note', total: '23.00' }),
        doc({ zatcaKind: 'debit-note', total: '57.50' }),
        doc({ issueDate: new Date('2026-10-30T10:00:00Z') }),
      ],
      now,
    )
    expect(total).toBe('149.50')
  })
})

describe('groupByMonth', () => {
  it('nets credit notes out of subtotal, VAT and total per month, newest month first', () => {
    const groups = groupByMonth([
      doc({ status: 'paid' }),
      doc({ zatcaKind: 'credit-note', status: 'draft', subtotal: '20.00', vatAmount: '3.00', total: '23.00' }),
      doc({ issueDate: new Date('2026-10-02T10:00:00Z') }),
    ])
    expect(groups.map((g) => g.monthKey)).toEqual(['2026-11', '2026-10'])
    expect(groups[0]).toMatchObject({ count: 2, subtotal: '80.00', vatAmount: '12.00', total: '92.00', paidTotal: '115.00' })
  })
})

describe('overallTotals', () => {
  it('counts only invoices as sales and nets notes into VAT and sales', () => {
    expect(
      overallTotals([
        doc(),
        doc({ zatcaKind: 'credit-note', vatAmount: '3.00', total: '23.00' }),
        doc({ zatcaKind: 'debit-note', vatAmount: '1.50', total: '11.50' }),
      ]),
    ).toEqual({ salesCount: 1, totalVat: '13.50', totalSales: '103.50' })
  })
})

describe('csvAmounts', () => {
  it('writes credit note amounts as negative numbers', () => {
    expect(csvAmounts(doc({ zatcaKind: 'credit-note', subtotal: '20.00', vatAmount: '3.00', total: '23.00' }))).toEqual([
      '-20.00',
      '-3.00',
      '-23.00',
    ])
    expect(csvAmounts(doc())).toEqual(['100.00', '15.00', '115.00'])
  })
})

describe('documentBadge', () => {
  it('labels notes by kind instead of a payment status', () => {
    expect(documentBadge({ status: 'draft', zatcaKind: 'credit-note' }, 'en').label).toBe('Credit note')
    expect(documentBadge({ status: 'draft', zatcaKind: 'debit-note' }, 'ar').label).toBe('إشعار مدين')
    expect(documentBadge({ status: 'draft', zatcaKind: 'credit-note' }, 'en').label).not.toBe('Draft')
  })

  it('keeps the payment status for invoices', () => {
    expect(documentBadge({ status: 'paid', zatcaKind: 'invoice' }, 'en')).toMatchObject({ label: 'Paid' })
    expect(documentBadge({ status: 'unpaid', zatcaKind: null }, 'ar').label).toBe('غير مدفوعة')
  })
})
