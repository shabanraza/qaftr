import { describe, expect, it } from 'vitest'
import { withEffectiveStatus } from './invoice-status'

const now = new Date('2026-11-14T12:00:00Z')

describe('withEffectiveStatus', () => {
  it('shows an unpaid invoice past its due date as overdue', () => {
    expect(withEffectiveStatus({ status: 'unpaid', dueDate: new Date('2026-11-13') }, now).status).toBe('overdue')
  })

  it('keeps unpaid when the due date is today or later, or missing', () => {
    expect(withEffectiveStatus({ status: 'unpaid', dueDate: new Date('2026-11-20') }, now).status).toBe('unpaid')
    expect(withEffectiveStatus({ status: 'unpaid', dueDate: null }, now).status).toBe('unpaid')
  })

  it('never changes paid or draft invoices', () => {
    expect(withEffectiveStatus({ status: 'paid', dueDate: new Date('2026-01-01') }, now).status).toBe('paid')
    expect(withEffectiveStatus({ status: 'draft', dueDate: new Date('2026-01-01') }, now).status).toBe('draft')
  })

  it('keeps the other fields', () => {
    expect(withEffectiveStatus({ id: 'a', status: 'unpaid', dueDate: null }, now)).toEqual({ id: 'a', status: 'unpaid', dueDate: null })
  })
})
