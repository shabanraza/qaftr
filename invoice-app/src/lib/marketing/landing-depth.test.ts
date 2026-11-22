import { describe, expect, it } from 'vitest'
import { LEGACY_LANDING_PATHS } from './legacy-redirects'
import { getSeoLandingPage, seoLandingSlugs } from './seo-landing-pages'
import type { SeoLandingSlug } from './seo-landing-pages'
import type { MarketingLang } from './lang'

const LONG_FORM: SeoLandingSlug[] = [
  'zatca-invoice-generator',
  'invoicing-software-saudi-arabia',
  'e-invoicing-saudi-arabia',
  'small-business-invoicing-saudi-arabia',
]
const LANGS: MarketingLang[] = ['ar', 'en']

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

function bodyWords(slug: SeoLandingSlug, lang: MarketingLang) {
  const p = getSeoLandingPage(slug, lang)
  return (
    words(p.intro) +
    p.sections.reduce((n, s) => n + words(s.heading) + words(s.body), 0) +
    p.faq.reduce((n, f) => n + words(f.question) + words(f.answer), 0)
  )
}

describe.each(LONG_FORM)('long-form landing page %s', (slug) => {
  it.each(LANGS)('has real depth in %s (800+ words in English, 550+ in Arabic, 8 sections, 5 FAQs)', (lang) => {
    const p = getSeoLandingPage(slug, lang)
    expect(bodyWords(slug, lang)).toBeGreaterThanOrEqual(lang === 'ar' ? 550 : 800)
    expect(p.sections.length).toBeGreaterThanOrEqual(8)
    expect(p.faq.length).toBeGreaterThanOrEqual(5)
    for (const s of p.sections) expect(words(s.body), s.heading).toBeGreaterThanOrEqual(25)
  })

  it.each(LANGS)('does not link to a merged (redirected) page in %s', (lang) => {
    const hrefs = getSeoLandingPage(slug, lang).related.map((r) => r.href)
    for (const legacy of LEGACY_LANDING_PATHS) expect(hrefs).not.toContain(legacy)
  })
})

describe('landing page set', () => {
  it('no longer lists the merged pages as landing pages', () => {
    for (const legacy of LEGACY_LANDING_PATHS) expect(seoLandingSlugs).not.toContain(legacy.slice(1))
  })

  it('keeps every landing page related link off the merged URLs', () => {
    for (const slug of seoLandingSlugs) {
      for (const lang of LANGS) {
        for (const r of getSeoLandingPage(slug, lang).related) {
          expect(LEGACY_LANDING_PATHS as readonly string[]).not.toContain(r.href)
        }
      }
    }
  })
})
