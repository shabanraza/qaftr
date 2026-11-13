import { describe, expect, it } from 'vitest'
import {
  formatAed,
  formatAeDate,
  langSearch,
  parseAmountInput,
  todayInUae,
} from './format'

describe('UAE formatting helpers', () => {
  it('formats ISO days in both languages without Intl', () => {
    expect(formatAeDate('2027-07-01', 'en')).toBe('1 Jul 2027')
    expect(formatAeDate('2027-01-01', 'ar')).toBe('1 يناير 2027')
  })

  it('formats AED amounts with grouping and 2 decimals', () => {
    expect(formatAed('1050', 'en')).toBe('1,050.00 AED')
    expect(formatAed(1234567.5, 'ar')).toBe('1,234,567.50 درهم')
    expect(formatAed('abc', 'en')).toBe('abc')
  })

  it('computes the UAE calendar day (UTC+4)', () => {
    expect(todayInUae(new Date('2026-12-31T20:30:00Z'))).toBe('2027-01-01')
    expect(todayInUae(new Date('2026-12-31T19:59:00Z'))).toBe('2026-12-31')
  })

  it('uses clean URLs for Arabic and ?lang=en for English', () => {
    expect(langSearch('ar')).toEqual({})
    expect(langSearch('en')).toEqual({ lang: 'en' })
  })
})

describe('parseAmountInput', () => {
  it('parses grouped, Arabic-Indic and decimal input', () => {
    expect(parseAmountInput('1,050.5')).toBe(1050.5)
    expect(parseAmountInput('١٬٠٥٠٫٥')).toBe(1050.5)
    expect(parseAmountInput(' 2 000 ')).toBe(2000)
    expect(parseAmountInput('-5')).toBe(-5)
  })

  it('returns NaN for non-numbers', () => {
    expect(parseAmountInput('abc')).toBeNaN()
    expect(parseAmountInput('12abc')).toBeNaN()
    expect(parseAmountInput('')).toBeNaN()
    expect(parseAmountInput('1.2.3')).toBeNaN()
  })
})
