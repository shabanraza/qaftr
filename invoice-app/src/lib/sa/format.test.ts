import { describe, expect, it } from 'vitest'
import { formatSaDate, formatSaNumber, todayInSaudi, toArabicIndic } from './format'

describe('Saudi formatting', () => {
  it('converts Latin digits and separators to Arabic-Indic', () => {
    expect(toArabicIndic('187,500.5 and 25')).toBe('١٨٧٬٥٠٠٫٥ and ٢٥')
  })

  it('formats numbers per language', () => {
    expect(formatSaNumber(187500, 'ar')).toBe('١٨٧٬٥٠٠')
    expect(formatSaNumber(187500, 'en')).toBe('187,500')
    expect(formatSaNumber(-131, 'ar')).toBe('-١٣١')
  })

  it('formats dates by hand (hydration-safe)', () => {
    expect(formatSaDate('2027-02-01', 'ar')).toBe('١ فبراير ٢٠٢٧')
    expect(formatSaDate('2027-02-01', 'en')).toBe('1 Feb 2027')
  })

  it('returns the Saudi calendar day (UTC+3)', () => {
    expect(todayInSaudi(new Date('2026-11-08T20:59:00Z'))).toBe('2026-11-08')
    expect(todayInSaudi(new Date('2026-11-08T21:00:00Z'))).toBe('2026-11-09')
  })
})
