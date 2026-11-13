import { describe, expect, it } from 'vitest'
import { documentFontFaceCss } from './document-fonts'
import { buildUaeInvoiceHtml } from '#/lib/ae/invoice-html'
import { createEmptyUaeDraft } from '#/lib/ae/invoice-draft'

describe('documentFontFaceCss', () => {
  it('declares self-hosted IBM Plex Sans Arabic faces, not Google Fonts', () => {
    const css = documentFontFaceCss([400, 600, 700])
    expect(css).not.toMatch(/googleapis|gstatic/)
    for (const w of [400, 600, 700]) {
      expect(css).toContain(`/fonts/ibm-plex-sans-arabic-arabic-${w}-normal.woff2`)
      expect(css).toContain(`/fonts/ibm-plex-sans-arabic-latin-${w}-normal.woff2`)
    }
    expect(css).toMatch(/font-display: swap/)
  })
})

describe('document previews use self-hosted fonts', () => {
  it('UAE invoice preview HTML has no Google Fonts import', () => {
    const html = buildUaeInvoiceHtml(createEmptyUaeDraft('2026-11-09', 'ar'))
    expect(html).not.toMatch(/googleapis/)
    expect(html).toContain('/fonts/ibm-plex-sans-arabic-')
  })
})
