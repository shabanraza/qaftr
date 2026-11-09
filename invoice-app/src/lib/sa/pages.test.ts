import { describe, expect, it } from 'vitest'
import { SITE_URL } from '#/lib/marketing/constants'
import { SA_PAGE_PATHS, buildSaPageHead } from './pages'
import type { SaPageId } from './pages'

type Head = ReturnType<typeof buildSaPageHead>
const link = (head: Head, hrefLang?: string) =>
  head.links.find((l) => (hrefLang ? l.hrefLang === hrefLang : l.rel === 'canonical'))?.href
const schemas = (head: Head) => head.scripts.map((s) => JSON.parse(s.children))
const types = (head: Head) => schemas(head).map((j) => j['@type'])

export function expectValidSaHead(id: SaPageId) {
  const path = SA_PAGE_PATHS[id]
  const ar = buildSaPageHead(id, 'ar')
  const en = buildSaPageHead(id, 'en')
  expect(link(ar)).toBe(`${SITE_URL}${path}`)
  expect(link(en)).toBe(`${SITE_URL}${path}?lang=en`)
  for (const head of [ar, en]) {
    expect(link(head, 'ar-SA')).toBe(`${SITE_URL}${path}`)
    expect(link(head, 'en-SA')).toBe(`${SITE_URL}${path}?lang=en`)
    expect(link(head, 'x-default')).toBe(`${SITE_URL}${path}`)
    const desc = head.meta.find((m) => 'name' in m && m.name === 'description')?.content as string
    expect(desc).not.toMatch(/official ZATCA|ZATCA-approved|معتمد من زاتكا/i)
  }
  return { ar, en }
}

describe('Saudi page heads', () => {
  it('builds the wave checker head with breadcrumb and FAQ', () => {
    expect(SA_PAGE_PATHS['zatca-wave-checker']).toBe('/tools/zatca-wave-checker')
    const { ar, en } = expectValidSaHead('zatca-wave-checker')
    expect(types(ar)).toEqual(['BreadcrumbList', 'FAQPage'])
    expect(types(en)).toEqual(['BreadcrumbList', 'FAQPage'])
    expect(JSON.stringify(schemas(en)[1])).toMatch(/1 February 2027/)
    expect(JSON.stringify(schemas(ar)[1])).toMatch(/١ فبراير ٢٠٢٧/)
    const crumbs = schemas(en)[0].itemListElement.map((i: { item: string }) => i.item)
    expect(crumbs).toEqual([
      `${SITE_URL}/?lang=en`,
      `${SITE_URL}/tools?lang=en`,
      `${SITE_URL}/tools/zatca-wave-checker?lang=en`,
    ])
  })

  it('builds the Wave 25 guide head with breadcrumb, Article (dateModified) and FAQ', () => {
    expect(SA_PAGE_PATHS['zatca-wave-25']).toBe('/guides/zatca-wave-25')
    const { ar, en } = expectValidSaHead('zatca-wave-25')
    for (const [head, lang] of [
      [ar, 'ar'],
      [en, 'en'],
    ] as const) {
      expect(types(head)).toEqual(['BreadcrumbList', 'Article', 'FAQPage'])
      const article = schemas(head)[1]
      expect(article.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(article.inLanguage).toBe(lang === 'ar' ? 'ar-SA' : 'en')
      expect(article.mainEntityOfPage).toBe(link(head))
      expect(article.headline.length).toBeLessThanOrEqual(110)
      expect(schemas(head)[2].mainEntity.length).toBeGreaterThanOrEqual(6)
    }
  })
})
