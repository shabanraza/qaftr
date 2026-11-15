import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDE_SLUGS, getGuide, getGuideList } from '#/lib/guides/content'
import { getComparison } from './comparison'
import { getHomeContent } from './home-content'
import type { MarketingLang } from './lang'
import { getSeoLandingPage, seoLandingSlugs } from './seo-landing-pages'

const LANGS: MarketingLang[] = ['ar', 'en']

/** A marketing href ("/guides/x", "/tools#y") must map to a route file. */
function routeExists(href: string): boolean {
  const path = href.split(/[?#]/)[0]!.replace(/^\//, '')
  const base = resolve(process.cwd(), 'src/routes')
  if (path === '') return existsSync(resolve(base, 'index.tsx'))
  return existsSync(resolve(base, `${path}.tsx`)) || existsSync(resolve(base, path, 'index.tsx'))
}

describe('home page content', () => {
  for (const lang of LANGS) {
    it(`has one large bento tile and 6–8 tiles in all [${lang}]`, () => {
      const { bento } = getHomeContent(lang)
      expect(bento.filter((tile) => tile.size === 'lg')).toHaveLength(1)
      expect(bento.length).toBeGreaterThanOrEqual(6)
      expect(bento.length).toBeLessThanOrEqual(8)
    })

    it(`links only to pages that exist [${lang}]`, () => {
      const c = getHomeContent(lang)
      const hrefs = [...c.bento.flatMap((t) => (t.href ? [t.href] : [])), ...c.resources.items.map((i) => i.href)]
      for (const href of hrefs) expect(routeExists(href), href).toBe(true)
    })

    it(`promotes every SEO page and guide from the resources block [${lang}]`, () => {
      const hrefs = getHomeContent(lang).resources.items.map((i) => i.href)
      for (const slug of seoLandingSlugs) expect(hrefs).toContain(`/${slug}`)
      for (const slug of GUIDE_SLUGS) expect(hrefs).toContain(`/guides/${slug}`)
      expect(hrefs).toContain('/guides')
    })

    it(`has an FAQ of at least five questions [${lang}]`, () => {
      expect(getHomeContent(lang).faq.length).toBeGreaterThanOrEqual(5)
    })
  }
})

describe('comparison table', () => {
  for (const lang of LANGS) {
    it(`has three columns and a value for each column in every row [${lang}]`, () => {
      const c = getComparison(lang)
      expect(c.columns).toHaveLength(3)
      expect(c.rows.length).toBeGreaterThanOrEqual(7)
      for (const row of c.rows) expect(row.cells).toHaveLength(3)
    })

    it(`is honest about Phase 2 and full accounting [${lang}]`, () => {
      const rows = getComparison(lang).rows
      const phase2 = rows.find((r) => r.id === 'phase2')!
      expect(phase2.cells[0]!.mark).toBe('partial')
      expect(phase2.cells[0]!.text).toMatch(lang === 'en' ? /private beta/i : /تجريبية/)
      expect(rows.find((r) => r.id === 'accounting')!.cells[0]!.mark).toBe('no')
    })

    it(`cites where the competitor prices come from [${lang}]`, () => {
      expect(getComparison(lang).footnote).toMatch(/2026|٢٠٢٦/)
    })
  }
})

describe('guides', () => {
  for (const lang of LANGS) {
    it(`lists every guide, including the Wave 25 guide, on the hub [${lang}]`, () => {
      const hrefs = getGuideList(lang).map((g) => g.href)
      expect(hrefs).toContain('/guides/zatca-wave-25')
      for (const slug of GUIDE_SLUGS) expect(hrefs).toContain(`/guides/${slug}`)
      for (const href of hrefs) expect(routeExists(href), href).toBe(true)
    })

    for (const slug of GUIDE_SLUGS) {
      it(`${slug} has sections, an FAQ and working related links [${lang}]`, () => {
        const g = getGuide(slug, lang)
        expect(g.sections.length).toBeGreaterThanOrEqual(4)
        expect(g.faq.length).toBeGreaterThanOrEqual(3)
        expect(g.seo.title.length).toBeLessThanOrEqual(70)
        for (const r of g.related) expect(routeExists(r.href), r.href).toBe(true)
      })
    }
  }

  it('keeps the same section ids in Arabic and English', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(getGuide(slug, 'ar').sections.map((s) => s.id)).toEqual(getGuide(slug, 'en').sections.map((s) => s.id))
    }
  })

  it('explains clearance for standard and 24-hour reporting for simplified invoices', () => {
    const g = JSON.stringify(getGuide('tax-invoice-vs-simplified-invoice', 'en'))
    expect(g).toMatch(/clear/i)
    expect(g).toMatch(/24 hours/)
  })
})

describe('new SEO landing pages', () => {
  it('include the software and comparison pages, with a table on the comparison page', () => {
    expect(seoLandingSlugs).toContain('invoicing-software-saudi-arabia')
    expect(seoLandingSlugs).toContain('e-invoicing-software-comparison-saudi-arabia')
    for (const lang of LANGS) {
      expect(getSeoLandingPage('e-invoicing-software-comparison-saudi-arabia', lang).comparison).toBe(true)
      for (const slug of seoLandingSlugs) {
        expect(routeExists(`/${slug}`), slug).toBe(true)
        for (const r of getSeoLandingPage(slug, lang).related) expect(routeExists(r.href), r.href).toBe(true)
      }
    }
  })
})

describe('sitemap', () => {
  const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf-8')
  it('lists every SEO page, guide and the guides hub in Arabic and English', () => {
    const paths = [...seoLandingSlugs.map((s) => `/${s}`), '/guides', ...GUIDE_SLUGS.map((s) => `/guides/${s}`)]
    for (const path of paths) {
      expect(xml, path).toContain(`<loc>https://qaftr.com${path}</loc>`)
      expect(xml, path).toContain(`<loc>https://qaftr.com${path}?lang=en</loc>`)
    }
  })
})
