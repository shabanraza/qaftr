import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_STORAGE_KEY, openConsentSettings } from '#/lib/analytics/consent'
import { ConsentBanner } from './ConsentBanner'

type W = typeof window & {
  gtag?: (...args: unknown[]) => void
  __qaftrAnalytics?: boolean
}
const w = window as W

beforeEach(() => {
  w.gtag = vi.fn()
  w.__qaftrAnalytics = true
})
afterEach(() => {
  delete w.gtag
  delete w.__qaftrAnalytics
  window.localStorage.clear()
})

describe('ConsentBanner', () => {
  it('renders nothing when analytics is not loaded', () => {
    delete w.__qaftrAnalytics
    const { container } = render(<ConsentBanner lang="en" />)
    expect(container.innerHTML).toBe("")
  })

  it('renders nothing once a choice is remembered', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
    const { container } = render(<ConsentBanner lang="en" />)
    expect(container.innerHTML).toBe("")
  })

  it('shows an English region with equal Accept / Reject buttons', () => {
    render(<ConsentBanner lang="en" />)
    const region = screen.getByRole('region', { name: /cookies/i })
    expect(region.getAttribute('dir')).toBe('ltr')
    const accept = screen.getByRole('button', { name: 'Accept' })
    const reject = screen.getByRole('button', { name: 'Reject' })
    expect(accept.className).toBe(reject.className)
  })

  it('is RTL in Arabic', () => {
    render(<ConsentBanner lang="ar" />)
    const region = screen.getByRole('region')
    expect(region.getAttribute('dir')).toBe('rtl')
    expect(region.getAttribute('lang')).toBe('ar')
    expect(screen.getByRole('button', { name: 'قبول' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'رفض' })).toBeTruthy()
  })

  it('accept grants analytics, remembers it and hides', () => {
    render(<ConsentBanner lang="en" />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    })
    expect(w.gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' })
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('reject denies, remembers it and hides', () => {
    render(<ConsentBanner lang="en" />)
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    })
    expect(w.gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' }),
    )
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('publishes its height so fixed bottom bars stack above it, and clears it on close', () => {
    const root = document.documentElement
    render(<ConsentBanner lang="en" />)
    const banner = screen.getByTestId('consent-banner')
    Object.defineProperty(banner, 'offsetHeight', { configurable: true, value: 180 })
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    expect(root.style.getPropertyValue('--qaftr-consent-offset')).toBe('180px')
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(root.style.getPropertyValue('--qaftr-consent-offset')).toBe('')
  })

  it('reopens from cookie settings after a choice, and switching to Reject denies', () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    render(<ConsentBanner lang="en" />)
    expect(screen.queryByRole('region')).toBeNull()
    act(() => {
      openConsentSettings()
    })
    const region = screen.getByRole('region', { name: /cookies/i })
    expect(document.activeElement).toBe(region)
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))
    expect(w.gtag).toHaveBeenCalledWith(
      'consent',
      'update',
      expect.objectContaining({ analytics_storage: 'denied', ad_storage: 'denied' }),
    )
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('denied')
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('ignores a settings request when analytics is not loaded', () => {
    delete w.__qaftrAnalytics
    const { container } = render(<ConsentBanner lang="en" />)
    act(() => {
      openConsentSettings()
    })
    expect(container.innerHTML).toBe('')
  })
})
