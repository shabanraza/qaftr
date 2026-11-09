import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

vi.mock('#/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
    signOut: vi.fn(),
    getSession: vi.fn(),
  },
}))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({
  AuthGateDialog: () => null,
}))

vi.mock('#/lib/marketing/region-geo', () => ({
  getVisitorCountry: () => Promise.resolve({ country: null }),
}))

const { MarketingLayout } =
  await import('#/components/marketing/MarketingLayout')
const { AeCrossLinkCard } = await import('./AeCrossLinkCard')

describe('UAE wiring', () => {
  it('adds a UAE link to the marketing nav and footer (Arabic)', async () => {
    renderWithRouter(
      <MarketingLayout lang="ar">
        <p>body</p>
      </MarketingLayout>,
    )
    await screen.findByText('body')
    const links = screen.getAllByRole('link', { name: /^الإمارات$/ })
    expect(links.length).toBe(2)
    for (const link of links) expect(link.getAttribute('href')).toBe('/ae')
  })

  it('keeps ?lang=en on the English UAE link', async () => {
    renderWithRouter(
      <MarketingLayout lang="en">
        <p>body</p>
      </MarketingLayout>,
    )
    await screen.findByText('body')
    const links = screen.getAllByRole('link', { name: /^UAE$/ })
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/ae?lang=en',
      '/ae?lang=en',
    ])
  })

  it('renders a cross-link card to the UAE hub for /tools', async () => {
    renderWithRouter(<AeCrossLinkCard lang="en" />)
    const link = await screen.findByRole('link', { name: /UAE/ })
    expect(link.getAttribute('href')).toBe('/ae?lang=en')
  })
})
