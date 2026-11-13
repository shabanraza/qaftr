import { describe, expect, it } from 'vitest'
import { getXmlValidatorCopy } from './xml-validator-copy'
import { SA_PAGE_PATHS, buildSaPageHead } from './pages'
import { expectValidSaHead } from './pages.test'

function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (typeof v === 'function') {
    const fn = v as (...a: unknown[]) => string
    // numeric helpers get a number; two-argument helpers interpolate values passed in by the caller
    out.push(fn.length === 1 ? fn(3) : fn('x', 'y'))
  }
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out))
  return out
}

const keys = (o: object) => Object.keys(o).sort()

describe('ZATCA XML validator page', () => {
  it('has a Saudi head with breadcrumb and FAQ', () => {
    expect(SA_PAGE_PATHS['zatca-xml-validator']).toBe('/tools/zatca-xml-validator')
    const { ar, en } = expectValidSaHead('zatca-xml-validator')
    for (const head of [ar, en]) {
      expect(head.scripts.map((s) => JSON.parse(s.children)['@type'])).toEqual(['BreadcrumbList', 'FAQPage'])
    }
    expect(buildSaPageHead('zatca-xml-validator', 'en').meta[0]).toEqual({ title: expect.stringMatching(/XML/) })
  })

  it('keeps SEO within limits and leads with the keyword', () => {
    for (const lang of ['ar', 'en'] as const) {
      const { seo } = getXmlValidatorCopy(lang)
      expect(seo.title.length, seo.title).toBeLessThanOrEqual(60)
      expect(seo.description.length, seo.description).toBeLessThanOrEqual(155)
    }
    expect(getXmlValidatorCopy('ar').seo.title).toMatch(/^مدقق ملف XML/)
    expect(getXmlValidatorCopy('en').seo.title).toMatch(/^ZATCA XML Validator/)
  })

  it('has the same message keys in Arabic and English, none empty', () => {
    const ar = getXmlValidatorCopy('ar')
    const en = getXmlValidatorCopy('en')
    for (const group of ['fields', 'rules', 'totals', 'mismatches', 'errors', 'signatureChecks'] as const) {
      expect(keys(ar[group]), group).toEqual(keys(en[group]))
      for (const v of [...Object.values(ar[group]), ...Object.values(en[group])]) expect(v, group).toBeTruthy()
    }
    // every rule the shared validator can raise has a message
    expect(Object.keys(en.rules)).toEqual(expect.arrayContaining(['SELLER_VAT_INVALID', 'ISSUE_DATE_IN_FUTURE', 'BUYER_REQUIRED', 'INVOICE_TYPE_INVALID']))
  })

  it("points to ZATCA's own tools for official checks and makes no approval claims", () => {
    expect(getXmlValidatorCopy('en').officialNote).toMatch(/SDK/)
    expect(getXmlValidatorCopy('en').officialNote).toMatch(/web-based validator/)
    expect(getXmlValidatorCopy('ar').officialNote).toMatch(/SDK/)
    expect(getXmlValidatorCopy('en').signatureVerified).toMatch(/does not confirm/)
    const all = strings([getXmlValidatorCopy('ar'), getXmlValidatorCopy('en')]).join(' ')
    expect(all).not.toMatch(/معتمد من|ZATCA[- ]approved|official validator|validated by ZATCA|الهيئة العامة للزكاة/i)
  })

  it('uses Arabic-Indic digits in Arabic copy', () => {
    // technical names and literal XML code values (388, 381, 383, scheme 700) keep their Latin digits
    const ar = strings(getXmlValidatorCopy('ar')).map((s) =>
      s.replace(/UBL 2.1|Base64|UTF-8|(388|381|383|700)(?![0-9])/g, ''),
    )
    expect(ar.filter((s) => /[؀-ۿ]/.test(s) && /[0-9]/.test(s))).toEqual([])
  })
})
