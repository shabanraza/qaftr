import { describe, expect, it } from 'vitest'
import { rootHeadMeta } from './status'

const title = (m: ReturnType<typeof rootHeadMeta>) => m.find((x) => 'title' in x)?.title

describe('root head meta', () => {
  it('keeps the brand title on normal pages', () => {
    expect(title(rootHeadMeta({ globalNotFound: false, search: {} }))).toBe('Qaftr | قافتر')
  })

  it('gives the 404 a localised title and noindex', () => {
    const ar = rootHeadMeta({ globalNotFound: true, search: {} })
    expect(title(ar)).toBe('الصفحة غير موجودة — قافتر')
    expect(ar).toContainEqual({ name: 'robots', content: 'noindex' })
    expect(title(rootHeadMeta({ globalNotFound: true, search: { lang: 'en' } }))).toBe(
      'Page not found — Qaftr',
    )
    expect(title(rootHeadMeta({ globalNotFound: true, search: { lang: ['EN'] } }))).toBe(
      'Page not found — Qaftr',
    )
  })
})
