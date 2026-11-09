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
