import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
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

const { MarketingNotFound, MarketingError } =
  await import('./MarketingStatusPages')

describe('MarketingNotFound', () => {
  it('renders a localised English 404 with links home and to tools', async () => {
    renderWithRouter(<MarketingNotFound />, '/nope?lang=en')
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Page not found/)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining(['/?lang=en', '/tools?lang=en']),
    )
  })

  it('renders Arabic by default', async () => {
    renderWithRouter(<MarketingNotFound />, '/nope')
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/الصفحة غير موجودة/)
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/tools']))
  })
})

describe('MarketingNotFound under /ae', () => {
  it('links to the UAE hub and UAE tools instead of the Saudi home (English)', async () => {
    renderWithRouter(<MarketingNotFound />, '/ae/nope?lang=en')
    await screen.findByRole('heading', { level: 1 })
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(
      expect.arrayContaining([
        '/ae?lang=en',
        '/ae/tools/invoice-generator?lang=en',
        '/ae/tools/e-invoicing-readiness?lang=en',
      ]),
    )
    const main = document.querySelector('main')!
    const mainHrefs = [...main.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(mainHrefs).not.toContain('/?lang=en')
  })

  it('uses Arabic labels on /ae by default', async () => {
    renderWithRouter(<MarketingNotFound />, '/ae/nope')
    expect((await screen.findByRole('link', { name: 'أدوات الإمارات' })).getAttribute('href')).toBe('/ae')
  })
})

describe('MarketingError', () => {
  it('shows a friendly localised message without leaking the error and offers a retry', async () => {
    const reset = vi.fn()
    renderWithRouter(
      <MarketingError
        error={new Error('ZodError: secret stack')}
        reset={reset}
      />,
      '/x?lang=en',
    )
    const h1 = await screen.findByRole('heading', { level: 1 })
    expect(h1.textContent).toMatch(/Something went wrong/)
    expect(document.body.textContent).not.toMatch(/secret stack/)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reset).toHaveBeenCalled()
  })
})
