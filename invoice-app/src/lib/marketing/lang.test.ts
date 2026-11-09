import { describe, expect, it } from 'vitest'
import { htmlLangAttr, marketingSearchSchema, regionFromPath } from './lang'

describe('regionFromPath', () => {
  it('detects UAE paths', () => {
    expect(regionFromPath('/ae')).toBe('ae')
    expect(regionFromPath('/ae/')).toBe('ae')
    expect(regionFromPath('/ae/tools/trn-checker')).toBe('ae')
  })

  it('defaults to Saudi for everything else', () => {
    expect(regionFromPath('/')).toBe('sa')
    expect(regionFromPath('/tools')).toBe('sa')
    expect(regionFromPath('/aerial')).toBe('sa')
  })
})

describe('htmlLangAttr', () => {
  it('keeps the Saudi values', () => {
    expect(htmlLangAttr('ar', 'sa')).toBe('ar-SA')
    expect(htmlLangAttr('en', 'sa')).toBe('en')
  })

  it('uses UAE locales on UAE pages', () => {
    expect(htmlLangAttr('ar', 'ae')).toBe('ar-AE')
    expect(htmlLangAttr('en', 'ae')).toBe('en-AE')
  })
})

describe('marketingSearchSchema', () => {
  it('accepts en case-insensitively', () => {
    expect(marketingSearchSchema.parse({ lang: 'en' })).toEqual({ lang: 'en' })
    expect(marketingSearchSchema.parse({ lang: 'EN' })).toEqual({ lang: 'en' })
    expect(marketingSearchSchema.parse({ lang: ' En ' })).toEqual({ lang: 'en' })
  })

  it('keeps ar', () => {
    expect(marketingSearchSchema.parse({ lang: 'ar' })).toEqual({ lang: 'ar' })
  })

  it('falls back to undefined for unknown, empty, duplicated or non-string values', () => {
    for (const lang of ['fr', '', ['fr', 'en'], 42, null]) {
      expect(() => marketingSearchSchema.parse({ lang })).not.toThrow()
      expect(marketingSearchSchema.parse({ lang }).lang).toBeUndefined()
    }
    expect(marketingSearchSchema.parse({}).lang).toBeUndefined()
  })

  it('uses the first value when lang is duplicated', () => {
    expect(marketingSearchSchema.parse({ lang: ['en', 'en'] }).lang).toBe('en')
  })
})
