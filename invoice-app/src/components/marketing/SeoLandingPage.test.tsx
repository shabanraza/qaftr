import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { renderWithRouter } from '#/test/render-with-router'

vi.mock('#/lib/auth-client', () => ({
  authClient: { useSession: () => ({ data: null }), signOut: vi.fn(), getSession: vi.fn() },
}))
vi.mock('#/components/instant-invoice/AuthGateDialog', () => ({ AuthGateDialog: () => null }))
vi.mock('#/lib/marketing/region-geo', () => ({
  getVisitorCountry: () => Promise.resolve({ country: null }),
}))

const { SeoLandingPage } = await import('./SeoLandingPage')

function relatedSection() {
  const heading = screen.getByRole('heading', { name: /Related pages|روابط ذات صلة/ })
  return within(heading.parentElement as HTMLElement)
}

describe('SeoLandingPage related pages', () => {
  it('navigates client-side and keeps ?lang=en', async () => {
    const { router } = renderWithRouter(
      <SeoLandingPage slug="zatca-invoice-generator" lang="en" />,
      '/zatca-invoice-generator?lang=en',
    )
    await screen.findByRole('heading', { name: 'Related pages' })
    const links = relatedSection().getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) expect(link.getAttribute('href')).toMatch(/^\/[^?]*\?lang=en$/)

    const target = links[0].getAttribute('href')!.split('?')[0]
    fireEvent.click(links[0])
    await waitFor(() => expect(router.state.location.pathname).toBe(target))
    expect(router.state.location.search).toEqual({ lang: 'en' })
  })

  it('Arabic links carry no lang param', async () => {
    renderWithRouter(<SeoLandingPage slug="zatca-invoice-generator" lang="ar" />, '/zatca-invoice-generator')
    await screen.findByRole('heading', { name: 'روابط ذات صلة' })
    for (const link of relatedSection().getAllByRole('link'))
      expect(link.getAttribute('href')).toMatch(/^\/[^?]*$/)
  })
})
