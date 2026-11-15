import { afterEach, describe, expect, it } from 'vitest'
import {
  INSTANT_INVOICE_DRAFT_KEY,
  SAUDI_INVOICE_TYPE_STORAGE_KEY,
  createEmptyDraft,
} from '@zatca/shared'
import { restoreDraft } from './draft-storage'

afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('restoreDraft', () => {
  it('returns the saved draft when one is stored', () => {
    const saved = { ...createEmptyDraft(), sellerName: 'Qaftr Design' }
    sessionStorage.setItem(INSTANT_INVOICE_DRAFT_KEY, JSON.stringify(saved))

    expect(restoreDraft(createEmptyDraft())).toMatchObject({
      sellerName: 'Qaftr Design',
      lineItems: saved.lineItems,
    })
  })

  // React may replay edits typed before the restore commits on top of the
  // restored draft; line edits find their row by id, so a fresh id would
  // silently drop them (seen on iPhone Safari / WebKit).
  it('keeps the current line item ids when nothing is stored', () => {
    const current = createEmptyDraft()
    const restored = restoreDraft(current)
    expect(restored.lineItems.map((item) => item.id)).toEqual(
      current.lineItems.map((item) => item.id),
    )
  })

  it('applies the remembered invoice type when nothing is stored', () => {
    localStorage.setItem(SAUDI_INVOICE_TYPE_STORAGE_KEY, 'standard')
    const current = createEmptyDraft('simplified')
    expect(restoreDraft(current)).toEqual({ ...current, invoiceType: 'standard' })
  })

  it('returns the same object when nothing changes', () => {
    const current = createEmptyDraft()
    expect(restoreDraft(current)).toBe(current)
  })
})
