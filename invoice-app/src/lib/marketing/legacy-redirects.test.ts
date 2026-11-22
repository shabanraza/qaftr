import { describe, expect, it } from 'vitest'
import { isRedirect } from '@tanstack/react-router'
import { LEGACY_LANDING_PATHS, legacyLandingRedirect } from './legacy-redirects'

function thrown(fn: () => void) {
  try {
    fn()
  } catch (e) {
    return e
  }
  return undefined
}

describe('legacy landing page redirects', () => {
  it('covers the three merged pages', () => {
    expect([...LEGACY_LANDING_PATHS].sort()).toEqual([
      '/free-invoice-generator',
      '/invoice-generator-saudi-arabia',
      '/vat-invoice-generator-saudi-arabia',
    ])
  })

  it('sends Arabic visitors to the tax invoice tool with a permanent 301', () => {
    const e = thrown(() => legacyLandingRedirect({}))
    expect(isRedirect(e)).toBe(true)
    const options = (e as { options: { href: string; statusCode: number } }).options
    expect(options.statusCode).toBe(301)
    expect(options.href).toBe('/tools/fatora')
  })

  it('keeps English with ?lang=en', () => {
    const e = thrown(() => legacyLandingRedirect({ lang: 'en' }))
    expect((e as { options: { href: string } }).options.href).toBe('/tools/fatora?lang=en')
  })

  it('ignores unknown language values', () => {
    const e = thrown(() => legacyLandingRedirect({ lang: 'fr' as 'en' }))
    expect((e as { options: { href: string } }).options.href).toBe('/tools/fatora')
  })
})
