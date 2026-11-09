import { describe, expect, it } from 'vitest'
import { SITE_URL } from './constants'
import {
  buildHreflangAlternates,
  buildMarketingHead,
  buildWebApplicationSchema,
  buildWebsiteSchema,
} from './seo'

function canonicalOf(head: ReturnType<typeof buildMarketingHead>) {
  return head.links.find((link) => link.rel === 'canonical')?.href
}

function robotsOf(head: ReturnType<typeof buildMarketingHead>) {
  return head.meta.find((m) => 'name' in m && m.name === 'robots')?.content
}

describe('buildMarketingHead', () => {
  it('makes the English version self-canonical with ?lang=en', () => {
    const head = buildMarketingHead({
      title: 'VAT calculator',
      description: 'd',
      path: '/tools/vat-calculator',
      lang: 'en',
    })
    expect(canonicalOf(head)).toBe(`${SITE_URL}/tools/vat-calculator?lang=en`)
  })

  it('makes the Arabic version self-canonical on the clean URL', () => {
    const head = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/tools',
      lang: 'ar',
    })
    expect(canonicalOf(head)).toBe(`${SITE_URL}/tools`)
  })

  it('marks private workspace paths noindex with no canonical', () => {
    const head = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/workspace/clients',
      lang: 'ar',
    })
    expect(robotsOf(head)).toBe('noindex, nofollow')
    expect(canonicalOf(head)).toBeUndefined()
  })
})

function hreflangs(head: ReturnType<typeof buildMarketingHead>) {
  return Object.fromEntries(
    head.links
      .filter((link) => link.rel === 'alternate')
      .map((link) => [link.hrefLang, link.href]),
  )
}

function metaProperty(
  head: ReturnType<typeof buildMarketingHead>,
  property: string,
) {
  return head.meta
    .filter((m) => 'property' in m && m.property === property)
    .map((m) => (m as { content: string }).content)
}

describe('buildMarketingHead regions', () => {
  it('gives unpaired Saudi pages an ar-SA / en-SA / x-default cluster and keeps og:locale', () => {
    const ar = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/tools',
      lang: 'ar',
    })
    expect(hreflangs(ar)).toEqual({
      'ar-SA': `${SITE_URL}/tools`,
      'en-SA': `${SITE_URL}/tools?lang=en`,
      'x-default': `${SITE_URL}/tools`,
    })
    expect(metaProperty(ar, 'og:locale')).toEqual(['ar_SA'])
    const en = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/tools',
      lang: 'en',
      region: 'sa',
    })
    expect(metaProperty(en, 'og:locale')).toEqual(['en_US'])
  })

  it('joins paired UAE pages into one cluster with their Saudi equivalent', () => {
    const head = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/ae/tools/trn-checker',
      lang: 'en',
      region: 'ae',
    })
    expect(hreflangs(head)).toEqual({
      'ar-SA': `${SITE_URL}/tools/trn-checker`,
      'en-SA': `${SITE_URL}/tools/trn-checker?lang=en`,
      'ar-AE': `${SITE_URL}/ae/tools/trn-checker`,
      'en-AE': `${SITE_URL}/ae/tools/trn-checker?lang=en`,
      'x-default': `${SITE_URL}/tools/trn-checker`,
    })
    expect(canonicalOf(head)).toBe(`${SITE_URL}/ae/tools/trn-checker?lang=en`)
  })

  it('emits the same cluster on both sides of every pair, each self-canonical', () => {
    const pairs: Array<[string, string]> = [
      ['/', '/ae'],
      ['/tools/vat-calculator', '/ae/tools/vat-calculator'],
      ['/tools/fatora', '/ae/tools/invoice-generator'],
      ['/tools/zatca-wave-checker', '/ae/tools/e-invoicing-readiness'],
      ['/guides/zatca-wave-25', '/ae/guides/uae-e-invoicing-2027'],
    ]
    for (const [sa, ae] of pairs) {
      const saHead = buildMarketingHead({ title: 't', description: 'd', path: sa, lang: 'ar' })
      const aeHead = buildMarketingHead({
        title: 't',
        description: 'd',
        path: ae,
        lang: 'ar',
        region: 'ae',
      })
      const cluster = {
        'ar-SA': `${SITE_URL}${sa}`,
        'en-SA': `${SITE_URL}${sa}?lang=en`,
        'ar-AE': `${SITE_URL}${ae}`,
        'en-AE': `${SITE_URL}${ae}?lang=en`,
        'x-default': `${SITE_URL}${sa}`,
      }
      expect(hreflangs(saHead), sa).toEqual(cluster)
      expect(hreflangs(aeHead), ae).toEqual(cluster)
      expect(canonicalOf(saHead)).toBe(`${SITE_URL}${sa}`)
      expect(canonicalOf(aeHead)).toBe(`${SITE_URL}${ae}`)
    }
  })

  it('buildHreflangAlternates lists Saudi first and x-default last', () => {
    expect(buildHreflangAlternates('/ae', 'ae').map((a) => a.hrefLang)).toEqual([
      'ar-SA',
      'en-SA',
      'ar-AE',
      'en-AE',
      'x-default',
    ])
  })

  it('uses ar_AE / en_AE og:locale for UAE pages', () => {
    const ar = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/ae',
      lang: 'ar',
      region: 'ae',
    })
    const en = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/ae',
      lang: 'en',
      region: 'ae',
    })
    expect(metaProperty(ar, 'og:locale')).toEqual(['ar_AE'])
    expect(metaProperty(en, 'og:locale')).toEqual(['en_AE'])
  })

  it('does not mention ZATCA in the UAE og:image alt text', () => {
    const head = buildMarketingHead({
      title: 't',
      description: 'd',
      path: '/ae',
      lang: 'ar',
      region: 'ae',
    })
    expect(metaProperty(head, 'og:image:alt')[0]).not.toMatch(/ZATCA/)
    expect(metaProperty(head, 'og:image:alt')[0]).toMatch(/UAE/)
  })
})

describe('site-wide JSON-LD is region-neutral', () => {
  it('WebSite covers Arabic and English, not just ar-SA', () => {
    expect(buildWebsiteSchema().inLanguage).toEqual(['ar', 'en'])
  })

  it('WebApplication serves Saudi Arabia and the UAE', () => {
    const app = buildWebApplicationSchema()
    expect(app.areaServed).toEqual([
      { '@type': 'Country', name: 'Saudi Arabia' },
      { '@type': 'Country', name: 'United Arab Emirates' },
    ])
    expect(app.offers.map((o) => o.priceCurrency)).toEqual(['SAR', 'AED'])
    const features = app.featureList.join(' ')
    expect(features).toMatch(/ZATCA/)
    expect(features).toMatch(/UAE/)
  })
})

describe('og:image alt positioning', () => {
  it('describes businesses, not freelancers, in both regions', async () => {
    const { buildMarketingHead } = await import('./seo')
    for (const region of ['sa', 'ae'] as const) {
      const head = buildMarketingHead({ title: 't', description: 'd', path: region === 'ae' ? '/ae' : '/', lang: 'en', region })
      const alt = head.meta.find((m) => 'property' in m && m.property === 'og:image:alt') as { content: string }
      expect(alt.content).toMatch(/businesses/)
      expect(alt.content).not.toMatch(/freelancer/i)
    }
  })
})
