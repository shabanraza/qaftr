import { describe, expect, it } from 'vitest'
import { getAeCopy } from '#/lib/ae/copy'
import { getAeGuide } from '#/lib/ae/guide-content'
import { getAeInvoiceCopy } from '#/lib/ae/invoice-copy'
import { buildUaeInvoiceHtml } from '#/lib/ae/invoice-html'
import { createEmptyUaeDraft } from '#/lib/ae/invoice-draft'
import { getInstantInvoiceCopy } from '#/lib/instant-invoice/copy'
import { buildInvoiceHtml } from '#/lib/instant-invoice/invoice-pdf'
import type { InvoiceForPdf } from '#/lib/instant-invoice/invoice-pdf'
import { getWaveCopy } from '#/lib/sa/wave-copy'
import { getWaveGuide } from '#/lib/sa/wave-guide-content'
import { getFatoraFaq } from '#/lib/tools/fatora-faq'
import { getToolsCopy } from '#/lib/tools/copy'
import { DOCUMENT_KINDS, getDocumentCopy } from '#/lib/documents/copy'
import { seoCopy, t } from './i18n'
import type { MarketingLang } from './lang'
import { getSeoLandingPage, seoLandingSlugs } from './seo-landing-pages'

/**
 * Copy rules (docs/COMPETITOR_UX_SPEC_2026-11-09.md, docs/COPY_CHANGES_2026-11-09.md):
 * - Qaftr sells to B2B and B2C businesses. Freelancer wording is a traffic
 *   channel only: dedicated landing page, guides and tool FAQs.
 * - KSA uses ZATCA terms, UAE uses FTA terms.
 * - No trust claim we cannot back (approval, accreditation, Phase 2).
 */
const LANGS: MarketingLang[] = ['ar', 'en']
const FREELANCER = /freelanc|للمستقلين|المستقلين|المستقلون|مستقلي|كمستقل|العمل الحر/i
const BUSINESS = /منش[أآ]|شرك|business|SME/i

const text = (v: unknown) => JSON.stringify(v)
const visible = (html: string) =>
  html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')

type Seo = { title: string; description: string }

/** Every indexable page's title/description, keyed by page id. */
function seoRegistry(lang: MarketingLang): Record<string, Seo> {
  const sa = seoCopy(lang)
  const tools = getToolsCopy(lang).seo
  const ae = getAeCopy(lang).seo
  const reg: Record<string, Seo> = {
    home: sa.home,
    privacy: sa.privacy,
    support: sa.support,
    'tools-hub': tools.hub,
    fatora: tools.fatora,
    'vat-calculator': tools['vat-calculator'],
    'trn-checker': tools['trn-checker'],
    'zatca-wave-checker': getWaveCopy(lang).seo,
    'zatca-wave-25': getWaveGuide(lang).seo,
  }
  for (const [id, seo] of Object.entries(ae)) reg[`ae-${id}`] = seo
  for (const slug of seoLandingSlugs) reg[slug] = getSeoLandingPage(slug, lang)
  for (const kind of DOCUMENT_KINDS) reg[kind] = getDocumentCopy(lang)[kind].seo
  return reg
}

/** Pages whose job is to catch freelancer searches and funnel them to the product. */
const FREELANCER_CHANNEL_PAGES = new Set(['free-invoice-generator', 'zatca-wave-25', 'ae-guide'])

describe('business positioning (not freelancers)', () => {
  for (const lang of LANGS) {
    it(`home, pricing, CTA and footer speak to businesses [${lang}]`, () => {
      const c = t(lang)
      expect(text([c.home, c.cta, c.footer])).not.toMatch(FREELANCER)
      expect(`${c.home.kicker} ${c.home.subtitle}`).toMatch(BUSINESS)
      expect(c.footer.tagline).toMatch(BUSINESS)
      expect(c.footer.taglineAe).toMatch(BUSINESS)
    })

    it(`product copy (invoice tools) has no freelancer positioning [${lang}]`, () => {
      expect(text(getInstantInvoiceCopy(lang))).not.toMatch(FREELANCER)
      expect(text(getAeInvoiceCopy(lang))).not.toMatch(FREELANCER)
      expect(text(getToolsCopy(lang).hub)).not.toMatch(FREELANCER)
      expect(text(getToolsCopy(lang).tools)).not.toMatch(FREELANCER)
      expect(text(getAeCopy(lang).hub)).not.toMatch(FREELANCER)
    })

    it(`core titles and meta descriptions target businesses [${lang}]`, () => {
      const offenders = Object.entries(seoRegistry(lang))
        .filter(([id]) => !FREELANCER_CHANNEL_PAGES.has(id))
        .filter(([, seo]) => FREELANCER.test(`${seo.title} ${seo.description}`))
        .map(([id]) => id)
      expect(offenders).toEqual([])
      const core = seoRegistry(lang)
      for (const id of ['home', 'tools-hub', 'ae-hub']) {
        expect(`${core[id].title} ${core[id].description}`, id).toMatch(BUSINESS)
      }
    })
  }

  it('keeps freelancer keywords on the freelancer channel (traffic)', () => {
    expect(text(getSeoLandingPage('free-invoice-generator', 'ar'))).toMatch(FREELANCER)
    expect(text(getSeoLandingPage('free-invoice-generator', 'en'))).toMatch(FREELANCER)
    expect(text(getFatoraFaq('ar'))).toMatch(FREELANCER)
    expect(getAeGuide('en').sections.map((s) => s.id)).toContain('freelancers')
  })
})

describe('H1 and CTA wording', () => {
  it('names the Saudi regime in the home H1 without implying Phase 2', () => {
    const ar = t('ar').home
    const en = t('en').home
    expect(`${ar.title} ${ar.titleAccent}`).toMatch(/زاتكا/)
    expect(`${ar.title} ${ar.titleAccent}`).toMatch(/المرحلة الأولى/)
    expect(`${en.title} ${en.titleAccent}`).toMatch(/ZATCA Phase 1/)
    expect(text([ar, en])).not.toMatch(/Phase 2|المرحلة الثانية|الربط والتكامل/)
  })

  it('names the UAE regime and 2027 in the UAE hub H1', () => {
    expect(getAeCopy('ar').hub.title).toMatch(/فوترة الإلكترونية/)
    expect(getAeCopy('ar').hub.title).toMatch(/2027/)
    expect(getAeCopy('en').hub.title).toMatch(/e-invoicing/i)
    expect(getAeCopy('en').hub.title).toMatch(/2027/)
  })

  it('uses the action-led free CTA with no-card micro-copy', () => {
    expect(getInstantInvoiceCopy('ar').heroCta).toBe('أصدر فاتورتك الأولى مجاناً')
    expect(getInstantInvoiceCopy('en').heroCta).toBe('Create your first invoice free')
    expect(t('ar').cta.createInvoice).toBe('أصدر فاتورتك الأولى مجاناً')
    expect(t('en').cta.createInvoice).toBe('Create your first invoice free')
    expect(t('ar').cta.noCard).toBe('بدون بطاقة ائتمان')
    expect(t('en').cta.noCard).toBe('No credit card')
  })
})

describe('no inaccurate trust claims', () => {
  const FORBIDDEN =
    /ZATCA[- ]approved|approved by ZATCA|ZATCA[- ]certified|معتمد من (هيئة )?(الزكاة|زاتكا)|معتمدة من (هيئة )?(الزكاة|زاتكا)|FTA[- ]accredited|accredited by the FTA|معتمد من الهيئة الاتحادية|official (ZATCA|FTA) partner|Phase 2[- ](ready|compliant)|(جاهز|متوافق)\S* (مع |لـ ?)?(متطلبات )?المرحلة الثانية/i

  for (const lang of LANGS) {
    it(`never claims approval, accreditation or Phase 2 [${lang}]`, () => {
      const all = text([
        t(lang),
        seoRegistry(lang),
        getToolsCopy(lang),
        getInstantInvoiceCopy(lang),
        getFatoraFaq(lang),
        getWaveCopy(lang),
        getWaveGuide(lang),
        getAeCopy(lang),
        getAeInvoiceCopy(lang),
        getAeGuide(lang),
        getDocumentCopy(lang),
      ])
      expect(all).not.toMatch(FORBIDDEN)
    })
  }
})

describe('glossary: Saudi (ZATCA) terms', () => {
  const invoice: InvoiceForPdf = {
    seqNumber: 7,
    issueDate: '2026-11-09T10:00:00Z',
    subtotal: '100',
    vatAmount: '15',
    total: '115',
    currency: 'SAR',
    notes: null,
    business: { nameAr: 'متجر', nameEn: null, vatNumber: '300000000000003', address: null },
    client: { name: 'شركة', vatNumber: '310000000000003', email: null, phone: null },
    lineItems: [{ description: 'x', qty: '1', unitPrice: '100', lineTotal: '100' }],
  }

  it('labels the VAT number without the UAE "TRN" term', () => {
    for (const lang of LANGS) {
      const ic = getInstantInvoiceCopy(lang)
      const tc = getToolsCopy(lang)
      const labels = [
        ic.sellerVat,
        ic.previewVatTrn,
        ic.clientVat,
        ic.previewChecks.sellerVat,
        tc.tools['trn-checker'].title,
        tc.tools['trn-checker'].subtitle,
        tc.trnChecker.inputLabel,
        tc.trnChecker.rulesTitle,
        tc.trnChecker.statusValid,
        tc.trnChecker.statusInvalid,
        tc.seo['trn-checker'].title,
      ]
      expect(labels.join(' | '), lang).not.toMatch(/TRN/)
    }
    expect(getInstantInvoiceCopy('ar').sellerVat).toBe('الرقم الضريبي')
    expect(getInstantInvoiceCopy('en').sellerVat).toBe('VAT number')
  })

  it('prints Seller/Buyer (البائع/المشتري) and the VAT number on the Saudi PDF', async () => {
    const ar = visible(await buildInvoiceHtml(invoice, 'ar', { includeQr: false }))
    const en = visible(await buildInvoiceHtml(invoice, 'en', { includeQr: false }))
    expect(ar).toContain('البائع')
    expect(ar).toContain('المشتري')
    expect(ar).toContain('الرقم الضريبي')
    expect(ar).toContain('فاتورة ضريبية مبسطة')
    expect(en).toContain('Seller')
    expect(en).toContain('Buyer')
    expect(en).toContain('VAT number')
    expect(en).toContain('Simplified Tax Invoice')
    expect(`${ar} ${en}`).not.toMatch(/TRN/)
    expect(ar).not.toMatch(/الهيئة العامة للزكاة/)
  })

  it('uses the official ZATCA Arabic name', () => {
    expect(getInstantInvoiceCopy('ar').disclaimer).toContain('هيئة الزكاة والضريبة والجمارك')
    expect(getInstantInvoiceCopy('ar').disclaimer).not.toContain('الهيئة العامة')
  })

  it('uses the ZATCA phase names', () => {
    const waves = text([getWaveCopy('ar'), getWaveGuide('ar')])
    expect(waves).toContain('مرحلة الربط والتكامل')
    expect(waves).toContain('مرحلة الإصدار')
  })
})

describe('glossary: UAE (FTA) terms', () => {
  const draft = () => ({
    ...createEmptyUaeDraft('2026-11-09', 'en'),
    supplier: { name: 'Supplier LLC', address: 'Dubai', trn: '100123456789003' },
    recipient: { name: 'Buyer LLC', address: 'Abu Dhabi', trn: '100987654321003', vatRegistered: true },
    lines: [{ description: 'x', qty: '1', unitPrice: '100', discount: '', vatCategory: 'standard' as const }],
  })

  it('labels the TRN as رقم التسجيل الضريبي in UAE Arabic copy', () => {
    expect(getAeInvoiceCopy('ar').trn).toBe('رقم التسجيل الضريبي (TRN)')
    expect(getAeCopy('ar').trn.inputLabel).toBe('رقم التسجيل الضريبي (TRN)')
    expect(getAeInvoiceCopy('en').trn).toBe('TRN (Tax Registration Number)')
  })

  it('prints Supplier/Recipient and the TRN on the UAE PDF', () => {
    const ar = visible(buildUaeInvoiceHtml({ ...draft(), outputLang: 'ar' }))
    const en = visible(buildUaeInvoiceHtml({ ...draft(), outputLang: 'en' }))
    expect(ar).toContain('المورّد')
    expect(ar).toContain('العميل')
    expect(ar).toContain('رقم التسجيل الضريبي')
    expect(ar).toContain('المبلغ المستحق')
    expect(en).toContain('Supplier')
    expect(en).toContain('Recipient')
    expect(en).toContain('TRN')
    expect(en).not.toContain('Bill to')
  })

  it('never uses Saudi/ZATCA terms in UAE product copy', () => {
    for (const lang of LANGS) {
      expect(text([getAeInvoiceCopy(lang), getAeCopy(lang).hub, getAeCopy(lang).seo])).not.toMatch(
        /ZATCA|زاتكا|Fatoora|بوابة فاتورة|البائع|المشتري/,
      )
    }
  })
})

describe('SEO titles and descriptions', () => {
  for (const lang of LANGS) {
    it(`fit SERP limits (title ≤60, description ≤155) [${lang}]`, () => {
      const tooLong = Object.entries(seoRegistry(lang)).flatMap(([id, s]) => [
        ...(s.title.length > 60 ? [`${id} title ${s.title.length}: ${s.title}`] : []),
        ...(s.description.length > 155 ? [`${id} description ${s.description.length}`] : []),
      ])
      expect(tooLong).toEqual([])
    })

    it(`are unique per page [${lang}]`, () => {
      const seos = Object.values(seoRegistry(lang))
      expect(new Set(seos.map((s) => s.title)).size).toBe(seos.length)
      expect(new Set(seos.map((s) => s.description)).size).toBe(seos.length)
    })
  }

  it('differ between Arabic and English', () => {
    const ar = seoRegistry('ar')
    const en = seoRegistry('en')
    for (const id of Object.keys(ar)) expect(ar[id].title, id).not.toBe(en[id].title)
  })
})
