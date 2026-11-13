import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

const getVisitorCountry = vi.fn()
vi.mock('#/lib/marketing/region-geo', () => ({
  getVisitorCountry: (...args: unknown[]) => getVisitorCountry(...args),
}))

const { RegionPicker, RegionLinks, RegionSuggestionBanner, resetVisitorCountryCache } =
  await import(
  './RegionSwitcher'
)

function clearCookie() {
  document.cookie = 'qaftr_region=; Max-Age=0; Path=/'
}

beforeEach(() => {
  clearCookie()
  getVisitorCountry.mockReset()
  resetVisitorCountryCache()
})
afterEach(clearCookie)

describe('RegionPicker (header dropdown)', () => {
  it('names the current region and lists both regions with flag + currency', async () => {
    renderWithRouter(<RegionPicker lang="en" />, '/tools/fatora?lang=en')
    const trigger = await screen.findByRole('button', { name: 'Country: Saudi Arabia' })
    expect(trigger.textContent).toContain('SAR')
    fireEvent.keyDown(trigger, { key: 'Enter' })
    const menu = await screen.findByRole('menu')
    const items = within(menu)
      .getAllByRole('menuitemradio')
      .map((el) => [el.textContent.trim(), el.getAttribute('href')])
    expect(items).toEqual([
      ['Saudi Arabia · SAR', '/tools/fatora?lang=en'],
      ['UAE · AED', '/ae/tools/invoice-generator?lang=en'],
    ])
    expect(
      within(menu).getByRole('menuitemradio', { name: /Saudi/ }).getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('choosing the UAE sets the cookie and navigates to the equivalent page', async () => {
    const { router } = renderWithRouter(<RegionPicker lang="ar" />, '/tools/vat-calculator')
    const trigger = await screen.findByRole('button', { name: 'الدولة: السعودية' })
    fireEvent.keyDown(trigger, { key: 'Enter' })
    fireEvent.click(await screen.findByRole('menuitemradio', { name: /الإمارات/ }))
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/ae/tools/vat-calculator'),
    )
    expect(document.cookie).toContain('qaftr_region=ae')
  })
})

describe('Region flags', () => {
  it('render as small decorative inline SVGs, never emoji (Windows shows emoji flags as letters)', async () => {
    const { container } = renderWithRouter(
      <>
        <RegionPicker lang="en" />
        <RegionLinks lang="en" />
      </>,
      '/?lang=en',
    )
    await screen.findByRole('button', { name: 'Country: Saudi Arabia' })
    expect(container.textContent).not.toMatch(/[\u{1F1E6}-\u{1F1FF}]/u)
    const flags = container.querySelectorAll('svg[data-flag]')
    // trigger + two footer links
    expect(flags.length).toBe(3)
    flags.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true')
      expect(svg.getAttribute('focusable')).toBe('false')
    })
    expect([...flags].map((f) => f.getAttribute('data-flag'))).toEqual(['sa', 'sa', 'ae'])
  })
})

describe('RegionLinks (footer / mobile menu)', () => {
  it('renders crawlable links to the equivalent page, keeping ?lang', async () => {
    renderWithRouter(<RegionLinks lang="en" />, '/ae/guides/uae-e-invoicing-2027?lang=en')
    const nav = await screen.findByRole('navigation', { name: 'Country' })
    const links = within(nav)
      .getAllByRole('link')
      .map((a) => [a.textContent.trim(), a.getAttribute('href'), a.getAttribute('aria-current')])
    expect(links).toEqual([
      ['Saudi Arabia · SAR', '/guides/zatca-wave-25?lang=en', null],
      ['UAE · AED', '/ae/guides/uae-e-invoicing-2027?lang=en', 'page'],
    ])
  })

  it('sets the cookie on click', async () => {
    renderWithRouter(<RegionLinks lang="ar" />, '/')
    fireEvent.click(await screen.findByRole('link', { name: /الإمارات/ }))
    expect(document.cookie).toContain('qaftr_region=ae')
  })
})

describe('RegionSuggestionBanner', () => {
  it('suggests the UAE page to a UAE visitor on a Saudi page', async () => {
    getVisitorCountry.mockResolvedValue({ country: 'AE' })
    renderWithRouter(<RegionSuggestionBanner lang="en" />, '/tools/fatora?lang=en')
    const banner = await screen.findByRole('region', { name: 'Country suggestion' })
    expect(banner.textContent).toContain('Looks like you’re in the UAE')
    expect(
      within(banner).getByRole('link', { name: 'Go to UAE page' }).getAttribute('href'),
    ).toBe('/ae/tools/invoice-generator?lang=en')
  })

  it('"Stay" remembers Saudi and hides the banner', async () => {
    getVisitorCountry.mockResolvedValue({ country: 'AE' })
    renderWithRouter(<RegionSuggestionBanner lang="ar" />, '/')
    const banner = await screen.findByRole('region', { name: 'اقتراح الدولة' })
    fireEvent.click(within(banner).getByRole('button', { name: 'البقاء في صفحة السعودية' }))
    await waitFor(() => expect(screen.queryByRole('region')).toBeNull())
    expect(document.cookie).toContain('qaftr_region=sa')
  })

  it('"Go" remembers the UAE and navigates without a full reload', async () => {
    getVisitorCountry.mockResolvedValue({ country: 'AE' })
    const { router } = renderWithRouter(<RegionSuggestionBanner lang="en" />, '/tools/trn-checker')
    fireEvent.click(await screen.findByRole('link', { name: 'Go to UAE page' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/ae/tools/trn-checker'))
    expect(document.cookie).toContain('qaftr_region=ae')
  })

  it('suggests Saudi to a Saudi visitor on a UAE page', async () => {
    getVisitorCountry.mockResolvedValue({ country: 'SA' })
    renderWithRouter(<RegionSuggestionBanner lang="en" />, '/ae')
    const banner = await screen.findByRole('region', { name: 'Country suggestion' })
    expect(within(banner).getByRole('link', { name: 'Go to Saudi page' }).getAttribute('href')).toBe(
      '/?lang=en',
    )
    expect(within(banner).getByRole('button', { name: 'Stay on UAE page' })).toBeTruthy()
  })

  it('does not ask the server or show anything once a region was chosen', async () => {
    document.cookie = 'qaftr_region=sa; Path=/'
    getVisitorCountry.mockResolvedValue({ country: 'AE' })
    renderWithRouter(<RegionSuggestionBanner lang="en" />, '/')
    await new Promise((r) => setTimeout(r, 20))
    expect(getVisitorCountry).not.toHaveBeenCalled()
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('shows nothing for other countries, unknown country or a failed lookup', async () => {
    for (const result of [
      () => Promise.resolve({ country: 'KW' }),
      () => Promise.resolve({ country: null }),
      () => Promise.reject(new Error('offline')),
    ]) {
      getVisitorCountry.mockImplementationOnce(result)
      const { unmount } = renderWithRouter(<RegionSuggestionBanner lang="en" />, '/')
      await waitFor(() => expect(getVisitorCountry).toHaveBeenCalled())
      await new Promise((r) => setTimeout(r, 20))
      expect(screen.queryByRole('region')).toBeNull()
      unmount()
      getVisitorCountry.mockClear()
      resetVisitorCountryCache()
    }
  })

  it('passes the ?_geo testing override to the server', async () => {
    getVisitorCountry.mockResolvedValue({ country: null })
    window.history.replaceState(null, '', '/?_geo=AE')
    resetVisitorCountryCache()
    try {
      renderWithRouter(<RegionSuggestionBanner lang="en" />, '/')
      await waitFor(() =>
        expect(getVisitorCountry).toHaveBeenCalledWith({ data: { geo: 'AE' } }),
      )
    } finally {
      window.history.replaceState(null, '', '/')
    }
  })
})
