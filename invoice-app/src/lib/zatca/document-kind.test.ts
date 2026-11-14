// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { amountSign, documentNumber, isNote } from './document-kind'

describe('document kind helpers', () => {
  it('numbers invoices INV-, credit notes CN- and debit notes DN-', () => {
    expect(documentNumber(7)).toBe('INV-007')
    expect(documentNumber(7, null)).toBe('INV-007')
    expect(documentNumber(12, 'credit-note')).toBe('CN-012')
    expect(documentNumber(1234, 'debit-note')).toBe('DN-1234')
  })
  it('subtracts credit notes only', () => {
    expect(amountSign('credit-note')).toBe(-1)
    expect(amountSign('debit-note')).toBe(1)
    expect(amountSign(null)).toBe(1)
    expect(isNote('invoice')).toBe(false)
    expect(isNote('credit-note')).toBe(true)
  })
})
