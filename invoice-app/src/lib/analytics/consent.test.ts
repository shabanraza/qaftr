import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CONSENT_STORAGE_KEY,
  applyConsent,
  consentUpdateFor,
  readConsent,
  writeConsent,
} from './consent'

type W = typeof window & { gtag?: (...args: unknown[]) => void }

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
  delete (window as W).gtag
})

describe('consentUpdateFor', () => {
  it('grants analytics only on accept; ad signals stay denied', () => {
    expect(consentUpdateFor('granted')).toEqual({ analytics_storage: 'granted' })
  })
  it('denies everything on reject', () => {
    expect(consentUpdateFor('denied')).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
    })
  })
})

describe('consent storage', () => {
  it('round-trips a choice and ignores junk', () => {
    expect(readConsent()).toBeNull()
    writeConsent('denied')
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    expect(readConsent()).toBe('denied')
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'maybe')
    expect(readConsent()).toBeNull()
  })

  it('never throws when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readConsent()).toBeNull()
    expect(() => writeConsent('granted')).not.toThrow()
  })
})

describe('applyConsent', () => {
  it('stores the choice and sends a consent update', () => {
    const gtag = vi.fn()
    ;(window as W).gtag = gtag
    applyConsent('granted')
    expect(readConsent()).toBe('granted')
    expect(gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' })
  })

  it('still stores the choice without gtag', () => {
    expect(() => applyConsent('denied')).not.toThrow()
    expect(readConsent()).toBe('denied')
  })
})

describe('consent settings request', () => {
  it('openConsentSettings notifies subscribers until they unsubscribe', async () => {
    const { openConsentSettings, onConsentSettingsRequest } = await import('./consent')
    const listener = vi.fn()
    const off = onConsentSettingsRequest(listener)
    openConsentSettings()
    expect(listener).toHaveBeenCalledTimes(1)
    off()
    openConsentSettings()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
