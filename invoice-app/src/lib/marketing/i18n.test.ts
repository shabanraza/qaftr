import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { t } from './i18n'

describe('home badges', () => {
  it('localises the ZATCA Phase 1 badge in Arabic', () => {
    expect(t('ar').home.badgeZatca).toBe('زاتكا · مرحلة الإصدار (المرحلة الأولى)')
    expect(t('en').home.badgeZatca).toBe('ZATCA Phase 1 (Generation)')
  })

  it('has no hard-coded English-only ZATCA badge on the home page', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/routes/index.tsx'), 'utf-8')
    expect(src).not.toMatch(/>\s*ZATCA Phase 1\s*</)
  })
})

describe('Pro plan promises', () => {
  // Pro only lifts the monthly saved-invoice limit today. Templates are not a
  // paid feature and WhatsApp follow-ups work on the free plan too.
  it.each(['ar', 'en'] as const)('does not sell templates or payment reminders as Pro features [%s]', async (lang) => {
    const { getBillingCopy } = await import('#/lib/billing/copy')
    const text = JSON.stringify([t(lang).home, t(lang).support, getBillingCopy(lang).proBody])
    expect(text).not.toMatch(/templates|payment reminders|القوالب|تذكيرات الدفع|تذكير العملاء/i)
    expect(text).toMatch(lang === 'en' ? /Unlimited invoices/ : /فواتير غير محدودة|بلا حد/)
  })
})
