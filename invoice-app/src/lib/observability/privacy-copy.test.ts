// Sentry is a processor: the policy and the consent banner must say so in both languages.
import { describe, expect, it } from 'vitest'
import { getConsentCopy } from '#/lib/analytics/consent-copy'
import { t } from '#/lib/marketing/i18n'

describe.each([
  ['ar', 'مراقبة الأعطال', ['الاتحاد الأوروبي', '٩٠ يوماً', 'ملفات تعريف الارتباط']],
  ['en', 'Error monitoring', ['European Union', '90 days', 'only if you accept cookies']],
] as const)('%s privacy wording', (lang, heading, facts) => {
  it('has an error monitoring section naming Sentry', () => {
    const section = t(lang).privacy.sections.find((s) => s.heading === heading)
    expect(section?.body).toContain('Sentry')
    for (const fact of facts) expect(section?.body).toContain(fact)
  })

  it('mentions error reports in the cookie banner', () => {
    expect(getConsentCopy(lang).body).toContain('Sentry')
    expect(getConsentCopy(lang).body).toContain('Google Analytics')
  })
})
