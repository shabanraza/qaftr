import { describe, expect, it } from 'vitest'
import { equivalentPath } from '#/lib/marketing/regions'
import { SITE_URL } from '#/lib/marketing/constants'
import { AE_PAGE_PATHS, buildAePageHead } from './pages'
import type { AePageId } from './pages'

type Head = ReturnType<typeof buildAePageHead>

const title = (head: Head) =>
  head.meta.find((m) => 'title' in m)?.title as string
const link = (head: Head, hrefLang?: string) =>
  head.links.find((l) =>
    hrefLang ? l.hrefLang === hrefLang : l.rel === 'canonical',
  )?.href

export function expectValidAeHead(id: AePageId) {
  const ar = buildAePageHead(id, 'ar')
  const en = buildAePageHead(id, 'en')
  const path = AE_PAGE_PATHS[id]
  expect(link(ar)).toBe(`${SITE_URL}${path}`)
  expect(link(en)).toBe(`${SITE_URL}${path}?lang=en`)
  for (const head of [ar, en]) {
    expect(link(head, 'ar-AE')).toBe(`${SITE_URL}${path}`)
    expect(link(head, 'en-AE')).toBe(`${SITE_URL}${path}?lang=en`)
    // Joined SA↔AE cluster: x-default is the Saudi Arabic equivalent.
    expect(link(head, 'x-default')).toBe(`${SITE_URL}${equivalentPath(path, 'sa')}`)
    expect(link(head, 'ar-SA')).toBe(`${SITE_URL}${equivalentPath(path, 'sa')}`)
    expect(head.scripts.length).toBeGreaterThan(0)
    for (const script of head.scripts) {
      expect(script.type).toBe('application/ld+json')
      expect(() => JSON.parse(script.children)).not.toThrow()
    }
  }
  expect(title(ar)).not.toBe(title(en))
  return { ar, en }
}

function schemaTypes(head: Head) {
  return head.scripts.map((s) => JSON.parse(s.children)['@type'])
}

function faqSchema(head: Head) {
  return head.scripts
    .map((s) => JSON.parse(s.children))
    .find((j) => j['@type'] === 'FAQPage')
}

describe('AE page heads', () => {
  it('builds the guide head with Article (dateModified) and FAQPage', () => {
    const { ar, en } = expectValidAeHead('guide')
    for (const [head, lang] of [
      [ar, 'ar'],
      [en, 'en'],
    ] as const) {
      expect(schemaTypes(head)).toEqual([
        'BreadcrumbList',
        'Article',
        'FAQPage',
      ])
      const article = head.scripts
        .map((s) => JSON.parse(s.children))
        .find((j) => j['@type'] === 'Article')
      expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.inLanguage).toBe(lang === 'ar' ? 'ar-AE' : 'en-AE')
      expect(article.publisher.name).toBe('Qaftr')
      expect(article.mainEntityOfPage).toBe(link(head))
      expect(article.headline.length).toBeLessThanOrEqual(110)
    }
  })

  it('builds the readiness head with FAQPage and caveated deadlines', () => {
    const { ar, en } = expectValidAeHead('e-invoicing-readiness')
    for (const head of [ar, en]) {
      expect(schemaTypes(head)).toEqual(['BreadcrumbList', 'FAQPage'])
    }
    const faq = JSON.stringify(faqSchema(en))
    expect(faq).toMatch(/1 Jan 2027/)
    expect(faq).toMatch(/1 Jul 2027/)
    expect(faq).toMatch(/1 Oct 2027/)
    expect(faq).toMatch(/verify/i)
  })

  it('builds the VAT calculator head with an FAQPage about 5%', () => {
    const { ar, en } = expectValidAeHead('vat-calculator')
    for (const head of [ar, en]) {
      expect(schemaTypes(head)).toEqual(['BreadcrumbList', 'FAQPage'])
    }
    expect(JSON.stringify(faqSchema(en))).toMatch(/5%/)
    expect(JSON.stringify(faqSchema(ar))).toMatch(/5٪/)
  })

  it('builds the TRN checker head with an FAQPage that points to the FTA', () => {
    const { ar, en } = expectValidAeHead('trn-checker')
    for (const head of [ar, en]) {
      expect(schemaTypes(head)).toEqual(['BreadcrumbList', 'FAQPage'])
      expect(faqSchema(head).mainEntity.length).toBeGreaterThanOrEqual(4)
    }
    expect(JSON.stringify(faqSchema(en))).toMatch(/FTA/)
    expect(JSON.stringify(faqSchema(en))).toMatch(/format only/i)
    expect(JSON.stringify(faqSchema(ar))).toMatch(/الهيئة الاتحادية للضرائب/)
  })

  it('builds the invoice generator head with FAQPage and HowTo', () => {
    const { ar, en } = expectValidAeHead('invoice-generator')
    expect(AE_PAGE_PATHS['invoice-generator']).toBe('/ae/tools/invoice-generator')
    for (const head of [ar, en]) {
      expect(schemaTypes(head)).toEqual(['BreadcrumbList', 'FAQPage', 'HowTo'])
      const howTo = head.scripts
        .map((s) => JSON.parse(s.children))
        .find((j) => j['@type'] === 'HowTo')
      expect(howTo.step.length).toBeGreaterThanOrEqual(4)
      expect(howTo.step[0]['@type']).toBe('HowToStep')
    }
    expect(JSON.stringify(faqSchema(en))).toMatch(/Peppol/)
  })

  it('builds a valid UAE head for the hub', () => {
    const { ar, en } = expectValidAeHead('hub')
    expect(AE_PAGE_PATHS.hub).toBe('/ae')
    expect(title(ar)).toMatch(/الإمارات/)
    expect(title(en)).toMatch(/UAE/)
  })

  it('includes a breadcrumb JSON-LD on every page', () => {
    const head = buildAePageHead('hub', 'en')
    const types = head.scripts.map((s) => JSON.parse(s.children)['@type'])
    expect(types).toContain('BreadcrumbList')
  })

  it('gives every page a unique title per language', () => {
    for (const lang of ['ar', 'en'] as const) {
      const titles = (Object.keys(AE_PAGE_PATHS) as AePageId[]).map((id) =>
        title(buildAePageHead(id, lang)),
      )
      expect(new Set(titles).size).toBe(titles.length)
    }
  })

  it('never claims FTA or MoF affiliation in descriptions', () => {
    for (const id of Object.keys(AE_PAGE_PATHS) as AePageId[]) {
      for (const lang of ['ar', 'en'] as const) {
        const desc = buildAePageHead(id, lang).meta.find(
          (m) => 'name' in m && m.name === 'description',
        )?.content as string
        expect(desc).not.toMatch(/official FTA|FTA-approved|معتمد من الهيئة/i)
      }
    }
  })
})
