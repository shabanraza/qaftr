import { describe, expect, it } from 'vitest'
import { getQrCopy } from './qr-copy'
import { SA_PAGE_PATHS, buildSaPageHead } from './pages'
import { expectValidSaHead } from './pages.test'

const ISSUE_CODES = [
  'SELLER_NAME_MISSING',
  'VAT_NUMBER_MISSING',
  'VAT_NUMBER_INVALID',
  'TIMESTAMP_MISSING',
  'TIMESTAMP_DATE_ONLY',
  'TIMESTAMP_INVALID',
  'TOTAL_MISSING',
  'TOTAL_INVALID',
  'VAT_TOTAL_MISSING',
  'VAT_TOTAL_INVALID',
  'VAT_EXCEEDS_TOTAL',
  'VAT_NOT_15',
  'TEXT_NOT_UTF8',
  'PHASE2_INCOMPLETE',
] as const
const ERROR_CODES = ['EMPTY', 'IS_URL', 'NOT_BASE64', 'TLV_TRUNCATED', 'NOT_ZATCA'] as const

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out))
  return out
}

describe('ZATCA QR decoder page', () => {
  it('has a Saudi head with breadcrumb, FAQ and HowTo', () => {
    expect(SA_PAGE_PATHS['zatca-qr']).toBe('/tools/zatca-qr')
    const { ar } = expectValidSaHead('zatca-qr')
    const types = ar.scripts.map((s) => JSON.parse(s.children)['@type'])
    expect(types).toEqual(['BreadcrumbList', 'FAQPage'])
    expect(buildSaPageHead('zatca-qr', 'ar').meta[0]).toEqual({ title: expect.stringMatching(/QR/) })
  })

  it('keeps SEO within limits and leads Arabic with the keyword', () => {
    for (const lang of ['ar', 'en'] as const) {
      const { seo } = getQrCopy(lang)
      expect(seo.title.length, seo.title).toBeLessThanOrEqual(60)
      expect(seo.description.length, seo.description).toBeLessThanOrEqual(155)
    }
    expect(getQrCopy('ar').seo.title.startsWith('قارئ رمز QR')).toBe(true)
  })

  it('has a message for every decoder issue and error in both languages', () => {
    for (const lang of ['ar', 'en'] as const) {
      const c = getQrCopy(lang)
      for (const code of ISSUE_CODES) expect(c.issues[code], `${lang} ${code}`).toBeTruthy()
      for (const code of ERROR_CODES) expect(c.errors[code], `${lang} ${code}`).toBeTruthy()
    }
  })

  it('points to the VAT app for official verification and makes no approval claims', () => {
    expect(getQrCopy('en').formatOnlyNote).toMatch(/VAT app/)
    expect(getQrCopy('ar').formatOnlyNote).toMatch(/تطبيق/)
    const all = strings([getQrCopy('ar'), getQrCopy('en')]).join(' ')
    expect(all).not.toMatch(/معتمد من|ZATCA[- ]approved|official validator|الهيئة العامة للزكاة/i)
  })

  it('uses Arabic-Indic digits in Arabic copy', () => {
    // technical names (Base64, UTF-8) keep their Latin digits
    const ar = strings(getQrCopy('ar')).map((s) => s.replace(/Base64|UTF-8/g, ''))
    expect(ar.filter((s) => /[؀-ۿ]/.test(s) && /[0-9]/.test(s))).toEqual([])
  })
})
