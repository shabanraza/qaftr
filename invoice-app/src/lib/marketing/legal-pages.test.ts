import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { seoCopy, t } from './i18n'
import type { MarketingLang } from './lang'

const LANGS: MarketingLang[] = ['ar', 'en']
const all = (lang: MarketingLang, page: 'terms' | 'refund' | 'privacy') => JSON.stringify(t(lang)[page])

describe.each(LANGS)('legal pages (%s)', (lang) => {
  it.each(['terms', 'refund'] as const)('%s has a title, an update date and several sections', (page) => {
    const copy = t(lang)[page]
    expect(copy.title.length).toBeGreaterThan(3)
    expect(copy.updated.length).toBeGreaterThan(5)
    expect(copy.sections.length).toBeGreaterThanOrEqual(page === 'terms' ? 10 : 6)
    for (const s of copy.sections) {
      expect(s.heading.length).toBeGreaterThan(2)
      expect(s.body.length).toBeGreaterThan(30)
    }
  })

  it.each(['terms', 'refund', 'privacy'] as const)('%s gives the support email', (page) => {
    expect(all(lang, page)).toContain('support@qaftr.com')
  })

  it('terms say Polar is the merchant of record and that subscriptions renew until cancelled', () => {
    const terms = all(lang, 'terms')
    expect(terms).toContain('Polar')
    expect(terms).toMatch(lang === 'en' ? /merchant of record/i : /بائع\s+(ال)?مسجّل/)
    expect(terms).toMatch(lang === 'en' ? /renew/i : /تتجدد/)
  })

  it('terms say Qaftr is not a ZATCA product and not tax advice', () => {
    const terms = all(lang, 'terms')
    expect(terms).toMatch(lang === 'en' ? /not affiliated with or endorsed by ZATCA/i : /غير تابع لهيئة الزكاة/)
    expect(terms).toMatch(lang === 'en' ? /not tax or legal advice/i : /ليست استشارة/)
  })

  it('refund policy states the refund windows and how to cancel', () => {
    const refund = all(lang, 'refund')
    expect(refund).toMatch(lang === 'en' ? /14 days/ : /١٤ يوماً/)
    expect(refund).toMatch(lang === 'en' ? /7 days/ : /٧ أيام/)
    expect(refund).toMatch(lang === 'en' ? /Manage subscription/ : /إدارة الاشتراك/)
  })

  it('privacy policy now names Polar as the payment processor', () => {
    expect(all(lang, 'privacy')).toContain('Polar')
  })

  it('never claims ZATCA approval or compliance', () => {
    const text = JSON.stringify([t(lang).terms, t(lang).refund])
    expect(text).not.toMatch(/approved|certified|compliant|معتمد/i)
  })

  it('has SEO titles and descriptions and footer labels', () => {
    for (const page of ['terms', 'refund'] as const) {
      expect(seoCopy(lang)[page].title).toContain(lang === 'ar' ? 'قافتر' : 'Qaftr')
      expect(seoCopy(lang)[page].description.length).toBeGreaterThan(30)
    }
    expect(t(lang).footer.terms.length).toBeGreaterThan(2)
    expect(t(lang).footer.refund.length).toBeGreaterThan(2)
  })
})

describe('sitemap', () => {
  const xml = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf-8')
  it.each(['/terms', '/refund'])('lists %s in Arabic and English', (path) => {
    expect(xml).toContain(`<loc>https://qaftr.com${path}</loc>`)
    expect(xml).toContain(`<loc>https://qaftr.com${path}?lang=en</loc>`)
  })
})
