import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CONSENT_STORAGE_KEY } from '#/lib/analytics/consent'
import { ConsentBanner } from './ConsentBanner'
import { CookieSettingsLink } from './CookieSettingsLink'

type W = typeof window & {
  gtag?: (...args: unknown[]) => void
  __qaftrAnalytics?: boolean
}
const w = window as W

beforeEach(() => {
  w.gtag = vi.fn()
  w.__qaftrAnalytics = true
  window.localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
})
afterEach(() => {
  delete w.gtag
  delete w.__qaftrAnalytics
  window.localStorage.clear()
})

describe('CookieSettingsLink', () => {
  it('renders nothing when analytics is not loaded (same condition as the banner)', () => {
    delete w.__qaftrAnalytics
    const { container } = render(<CookieSettingsLink lang="en" />)
    expect(container.innerHTML).toBe('')
  })

  it('has Arabic and English labels', () => {
    const { unmount } = render(<CookieSettingsLink lang="ar" />)
    expect(screen.getByRole('button', { name: 'إعدادات ملفات تعريف الارتباط' })).toBeTruthy()
    unmount()
    render(<CookieSettingsLink lang="en" />)
    expect(screen.getByRole('button', { name: 'Cookie settings' })).toBeTruthy()
  })

  it('reopens the consent banner so the choice can be changed', () => {
    render(
      <>
        <CookieSettingsLink lang="en" />
        <ConsentBanner lang="en" />
      </>,
    )
    expect(screen.queryByRole('region')).toBeNull()
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Cookie settings' }))
    })
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(w.gtag).toHaveBeenCalledWith('consent', 'update', { analytics_storage: 'granted' })
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBe('granted')
  })
})
